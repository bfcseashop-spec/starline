import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface TikTokCreds {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  open_id?: string;
}

/**
 * TikTok Content Posting API — PULL_FROM_URL mode.
 * Requires invite-level access to the Content Posting API.
 */
@Injectable()
export class TikTokPublisher implements Publisher {
  readonly platform: Platform = "tiktok";
  private readonly logger = new Logger(TikTokPublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as TikTokCreds | null;
    if (!creds?.access_token) {
      throw new Error("TikTok connection missing access_token");
    }
    const video = ctx.broadcast.video_url;
    if (!video) throw new Error("TikTok requires a video_url");

    const title = (ctx.broadcast.content || "").slice(0, 2200);

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: video,
        },
      }),
    });
    const json: any = await initRes.json().catch(() => ({}));
    if (!initRes.ok || json?.error?.code !== "ok") {
      throw new Error(`TikTok publish error: ${json?.error?.message || initRes.statusText}`);
    }
    const publishId = json?.data?.publish_id;
    return { external_id: publishId ? String(publishId) : undefined };
  }
}
