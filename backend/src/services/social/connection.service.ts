import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database.service";
import { decryptJson, encryptJson, maskCredentials } from "./crypto";
import type {
  ConnectionStatus,
  Platform,
  SocialConnectionRow,
} from "./types";

export interface UpsertConnectionInput {
  id?: string;
  platform: Platform;
  account_label?: string | null;
  account_external_id?: string | null;
  credentials: Record<string, any> | null;
  meta?: Record<string, any> | null;
  status?: ConnectionStatus;
  expires_at?: string | null;
  created_by?: string | null;
}

@Injectable()
export class SocialConnectionService {
  private readonly logger = new Logger(SocialConnectionService.name);

  constructor(private readonly db: DatabaseService) {}

  async list(platform?: Platform): Promise<SocialConnectionRow[]> {
    const filters: Record<string, any> = {};
    if (platform) filters.platform = platform;
    const rows = (await this.db.select(
      "social_connections",
      filters,
      `"created_at" DESC`,
    )) as SocialConnectionRow[];
    return rows;
  }

  async findById(id: string): Promise<SocialConnectionRow | null> {
    const rows = (await this.db.select("social_connections", { id })) as SocialConnectionRow[];
    return rows[0] || null;
  }

  async findActiveByPlatform(platform: Platform): Promise<SocialConnectionRow[]> {
    return ((await this.db.select("social_connections", {
      platform,
      status: "active",
    })) as SocialConnectionRow[]);
  }

  async upsert(input: UpsertConnectionInput): Promise<SocialConnectionRow> {
    const credentials_enc = input.credentials ? encryptJson(input.credentials) : null;
    const payload: Record<string, any> = {
      platform: input.platform,
      account_label: input.account_label ?? null,
      account_external_id: input.account_external_id ?? null,
      credentials_enc,
      meta: input.meta ?? {},
      status: input.status ?? "active",
      expires_at: input.expires_at ?? null,
      last_error: null,
      created_by: input.created_by ?? null,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const updated = await this.db.update("social_connections", payload, { id: input.id });
      if (updated[0]) {
        await this.audit(updated[0].id, input.platform, "updated", { account_label: input.account_label }, input.created_by);
        return updated[0] as SocialConnectionRow;
      }
    }

    if (input.account_external_id) {
      const existing = (await this.db.select("social_connections", {
        platform: input.platform,
        account_external_id: input.account_external_id,
      })) as SocialConnectionRow[];
      if (existing[0]) {
        const updated = await this.db.update("social_connections", payload, { id: existing[0].id });
        if (updated[0]) {
          await this.audit(updated[0].id, input.platform, "reconnected", { account_label: input.account_label }, input.created_by);
          return updated[0] as SocialConnectionRow;
        }
      }
    }

    const created = (await this.db.insert("social_connections", payload)) as SocialConnectionRow;
    await this.audit(created.id, input.platform, "connected", { account_label: input.account_label }, input.created_by);
    return created;
  }

  async setStatus(id: string, status: ConnectionStatus, last_error: string | null = null) {
    await this.db.update(
      "social_connections",
      { status, last_error, updated_at: new Date().toISOString() },
      { id },
    );
  }

  async markUsed(id: string) {
    await this.db.update(
      "social_connections",
      { last_used_at: new Date().toISOString() },
      { id },
    );
  }

  async remove(id: string, actorId?: string | null) {
    const conn = await this.findById(id);
    if (!conn) return;
    await this.db.remove("social_connections", { id });
    await this.audit(id, conn.platform, "disconnected", { account_label: conn.account_label }, actorId ?? null);
  }

  async getCredentials<T = Record<string, any>>(idOrConn: string | SocialConnectionRow): Promise<T | null> {
    const conn = typeof idOrConn === "string" ? await this.findById(idOrConn) : idOrConn;
    if (!conn) return null;
    return decryptJson<T>(conn.credentials_enc);
  }

  async updateCredentials(id: string, credentials: Record<string, any>, expires_at?: string | null) {
    const credentials_enc = encryptJson(credentials);
    const payload: Record<string, any> = {
      credentials_enc,
      updated_at: new Date().toISOString(),
    };
    if (expires_at !== undefined) payload.expires_at = expires_at;
    await this.db.update("social_connections", payload, { id });
  }

  toPublic(conn: SocialConnectionRow) {
    const creds = decryptJson<Record<string, any>>(conn.credentials_enc);
    return {
      id: conn.id,
      platform: conn.platform,
      account_label: conn.account_label,
      account_external_id: conn.account_external_id,
      meta: conn.meta || {},
      status: conn.status,
      expires_at: conn.expires_at,
      last_error: conn.last_error,
      last_used_at: conn.last_used_at,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      credential_preview: maskCredentials(creds),
    };
  }

  async audit(
    connection_id: string | null,
    platform: string,
    event: string,
    details: Record<string, any> = {},
    actor_id: string | null = null,
  ) {
    try {
      await this.db.insert("social_audit_log", {
        connection_id,
        platform,
        event,
        details,
        actor_id,
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
  }
}
