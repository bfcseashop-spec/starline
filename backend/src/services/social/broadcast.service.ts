import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database.service";
import { SocialConnectionService } from "./connection.service";
import { PublisherRegistry } from "./publisher.registry";
import { PLATFORM_INFO } from "./platform-info";
import type {
  Platform,
  PublishContext,
  SocialBroadcastRow,
  SocialBroadcastTargetRow,
  SocialConnectionRow,
} from "./types";

export interface CreateBroadcastInput {
  content?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  link?: string | null;
  scheduled_at?: string | null;
  status?: "draft" | "pending" | "publishing";
  /** Per-platform: one of either platform (uses all active connections of that platform) or specific connection_id. */
  targets: Array<{ platform: Platform; connection_id?: string }>;
  created_by?: string | null;
}

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  private readonly inflight = new Set<string>();

  constructor(
    private readonly db: DatabaseService,
    private readonly connections: SocialConnectionService,
    private readonly publishers: PublisherRegistry,
  ) {}

  async create(input: CreateBroadcastInput): Promise<{ broadcast: SocialBroadcastRow; targets: SocialBroadcastTargetRow[] }> {
    if (!input.targets?.length) throw new Error("At least one target platform required");

    const status = input.status === "draft" ? "draft" : "pending";
    const broadcast = (await this.db.insert("social_broadcasts", {
      content: input.content ?? null,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      link: input.link ?? null,
      scheduled_at: input.scheduled_at ?? null,
      status,
      created_by: input.created_by ?? null,
    })) as SocialBroadcastRow;

    const targets: SocialBroadcastTargetRow[] = [];
    for (const t of input.targets) {
      const info = PLATFORM_INFO[t.platform];
      if (!info) continue;

      let connectionIds: Array<string | null> = [];
      if (t.connection_id) {
        connectionIds = [t.connection_id];
      } else if (info.connectKind === "internal") {
        connectionIds = [null];
      } else {
        const active = await this.connections.findActiveByPlatform(t.platform);
        connectionIds = active.length ? active.map((c) => c.id) : [null];
      }

      for (const connId of connectionIds) {
        const targetStatus = status === "draft" ? "skipped" : "pending";
        const row = (await this.db.insert("social_broadcast_targets", {
          broadcast_id: broadcast.id,
          connection_id: connId,
          platform: t.platform,
          status: targetStatus,
          scheduled_at: input.scheduled_at ?? null,
          attempts: 0,
        })) as SocialBroadcastTargetRow;
        targets.push(row);
      }
    }

    return { broadcast, targets };
  }

  async listBroadcasts(): Promise<SocialBroadcastRow[]> {
    return ((await this.db.select("social_broadcasts", {}, `"created_at" DESC`)) as SocialBroadcastRow[]);
  }

  async listTargets(broadcast_id: string): Promise<SocialBroadcastTargetRow[]> {
    return ((await this.db.select(
      "social_broadcast_targets",
      { broadcast_id },
      `"created_at" ASC`,
    )) as SocialBroadcastTargetRow[]);
  }

  async listAllTargets(): Promise<SocialBroadcastTargetRow[]> {
    return ((await this.db.select(
      "social_broadcast_targets",
      {},
      `"created_at" ASC`,
    )) as SocialBroadcastTargetRow[]);
  }

  async cancel(id: string) {
    await this.db.update("social_broadcasts", { status: "cancelled", updated_at: new Date().toISOString() }, { id });
    const targets = await this.listTargets(id);
    for (const t of targets) {
      if (t.status === "pending") {
        await this.db.update(
          "social_broadcast_targets",
          { status: "cancelled", updated_at: new Date().toISOString() },
          { id: t.id },
        );
      }
    }
  }

  async retryTarget(id: string) {
    await this.db.update(
      "social_broadcast_targets",
      { status: "pending", error_message: null, updated_at: new Date().toISOString() },
      { id },
    );
  }

  async deleteBroadcast(id: string) {
    await this.db.remove("social_broadcast_targets", { broadcast_id: id });
    await this.db.remove("social_broadcasts", { id });
  }

  /**
   * Pick up pending targets that are due, claim them, and publish.
   * Called both by the scheduler tick and on-demand right after creation.
   */
  async runDueTargets(maxConcurrent = 4): Promise<{ processed: number }> {
    const all = await this.listAllTargets();
    const now = Date.now();
    const due = all.filter((t) => {
      if (t.status !== "pending") return false;
      if (this.inflight.has(t.id)) return false;
      if (!t.scheduled_at) return true;
      return new Date(t.scheduled_at).getTime() <= now;
    });
    if (!due.length) return { processed: 0 };

    let processed = 0;
    for (let i = 0; i < due.length; i += maxConcurrent) {
      const slice = due.slice(i, i + maxConcurrent);
      await Promise.all(slice.map((t) => this.executeTarget(t.id)));
      processed += slice.length;
    }
    return { processed };
  }

  async executeTarget(targetId: string) {
    if (this.inflight.has(targetId)) return;
    this.inflight.add(targetId);
    try {
      const targetRows = (await this.db.select("social_broadcast_targets", {
        id: targetId,
      })) as SocialBroadcastTargetRow[];
      const target = targetRows[0];
      if (!target || target.status !== "pending") return;

      await this.db.update(
        "social_broadcast_targets",
        {
          status: "publishing",
          attempts: (target.attempts || 0) + 1,
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { id: targetId },
      );

      const broadcastRows = (await this.db.select("social_broadcasts", {
        id: target.broadcast_id,
      })) as SocialBroadcastRow[];
      const broadcast = broadcastRows[0];
      if (!broadcast) {
        await this.db.update(
          "social_broadcast_targets",
          {
            status: "failed",
            error_message: "Parent broadcast not found",
            updated_at: new Date().toISOString(),
          },
          { id: targetId },
        );
        return;
      }
      if (broadcast.status === "cancelled") {
        await this.db.update(
          "social_broadcast_targets",
          { status: "cancelled", updated_at: new Date().toISOString() },
          { id: targetId },
        );
        return;
      }

      let connection: SocialConnectionRow | null = null;
      let credentials: Record<string, any> | null = null;
      if (target.connection_id) {
        connection = await this.connections.findById(target.connection_id);
        if (!connection) {
          await this.failTarget(targetId, "Connection no longer exists");
          return;
        }
        credentials = await this.connections.getCredentials(connection);
      } else {
        connection = {
          id: "",
          platform: target.platform,
          account_label: null,
          account_external_id: null,
          credentials_enc: null,
          meta: {},
          status: "active",
          expires_at: null,
          last_error: null,
          last_used_at: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const publisher = this.publishers.get(target.platform);
      if (!publisher) {
        await this.failTarget(targetId, `No publisher registered for ${target.platform}`);
        return;
      }

      try {
        const ctx: PublishContext = { broadcast, target, connection, credentials };
        const result = await publisher.publish(ctx);

        await this.db.update(
          "social_broadcast_targets",
          {
            status: "published",
            external_id: result.external_id || null,
            external_url: result.external_url || null,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
          },
          { id: targetId },
        );
        if (connection.id) await this.connections.markUsed(connection.id);
        await this.connections.audit(connection.id || null, target.platform, "published", {
          target_id: targetId,
          broadcast_id: broadcast.id,
          external_id: result.external_id,
        });
        await this.refreshBroadcastStatus(broadcast.id);
      } catch (err) {
        const msg = (err as Error).message || String(err);
        this.logger.warn(`Publish failed [${target.platform}]: ${msg}`);
        await this.failTarget(targetId, msg);
        await this.connections.audit(connection.id || null, target.platform, "publish_failed", {
          target_id: targetId,
          broadcast_id: broadcast.id,
          error: msg,
        });
      }
    } finally {
      this.inflight.delete(targetId);
    }
  }

  private async failTarget(id: string, error_message: string) {
    await this.db.update(
      "social_broadcast_targets",
      { status: "failed", error_message, updated_at: new Date().toISOString() },
      { id },
    );
    const rows = (await this.db.select("social_broadcast_targets", { id })) as SocialBroadcastTargetRow[];
    const target = rows[0];
    if (target) await this.refreshBroadcastStatus(target.broadcast_id);
  }

  private async refreshBroadcastStatus(broadcast_id: string) {
    const targets = await this.listTargets(broadcast_id);
    if (!targets.length) return;
    const all = (s: string) => targets.every((t) => t.status === s);
    const some = (s: string) => targets.some((t) => t.status === s);
    let status: SocialBroadcastRow["status"] = "publishing";
    if (all("published")) status = "completed";
    else if (all("failed") || all("cancelled")) status = "failed";
    else if (!some("pending") && !some("publishing")) {
      status = some("published") ? "partial" : "failed";
    } else if (some("publishing")) {
      status = "publishing";
    } else {
      status = "pending";
    }
    await this.db.update(
      "social_broadcasts",
      { status, updated_at: new Date().toISOString() },
      { id: broadcast_id },
    );
  }
}
