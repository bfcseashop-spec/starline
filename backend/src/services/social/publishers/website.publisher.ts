import { Injectable } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";
import { DatabaseService } from "../../database.service";

/**
 * "Posting to the website" means flipping the legacy social_media_posts row
 * so the public homepage can render it. We always succeed unless content is missing.
 */
@Injectable()
export class WebsitePublisher implements Publisher {
  readonly platform: Platform = "website";

  constructor(private readonly db: DatabaseService) {}

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const { broadcast } = ctx;
    if (!broadcast.content && !broadcast.image_url && !broadcast.video_url) {
      throw new Error("Empty broadcast — nothing to post to the website");
    }

    const row = await this.db.insert("social_media_posts", {
      platform: "website",
      content: broadcast.content,
      body: broadcast.content,
      image_url: broadcast.image_url,
      link: broadcast.link,
      status: "published",
      scheduled_at: broadcast.scheduled_at,
      published_at: new Date().toISOString(),
      created_by: broadcast.created_by,
    });

    return {
      external_id: row?.id || broadcast.id,
      external_url: broadcast.link || null,
    };
  }
}
