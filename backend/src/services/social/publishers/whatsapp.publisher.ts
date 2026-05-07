import { Injectable, Logger } from "@nestjs/common";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";
import { WhatsAppDriver } from "../whatsapp.driver";

/**
 * WhatsApp Status posting via WhatsApp Web automation (Playwright).
 * UNOFFICIAL — provided as a best-effort fallback. May break without notice.
 */
@Injectable()
export class WhatsAppPublisher implements Publisher {
  readonly platform: Platform = "whatsapp";
  private readonly logger = new Logger(WhatsAppPublisher.name);

  constructor(private readonly driver: WhatsAppDriver) {}

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const profileDir = await this.driver.profileDirFor(ctx.connection.id);
    const exists = await fs
      .stat(path.join(profileDir, "Default"))
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      throw new Error("WhatsApp not logged in for this connection. Open the Connection panel and scan the QR.");
    }

    return await this.driver.postStatus(ctx.connection.id, {
      text: ctx.broadcast.content,
      imageUrl: ctx.broadcast.image_url,
      videoUrl: ctx.broadcast.video_url,
    });
  }
}
