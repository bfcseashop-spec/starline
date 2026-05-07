import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface InstagramCreds {
  /** IG Business account id (from FB Graph API, not the user-facing IG handle). */
  ig_user_id: string;
  /** Page access token for the FB Page linked to this IG Business account. */
  page_access_token: string;
}

/**
 * Instagram Graph API — 2-step container + publish flow.
 * Requires IG Business account linked to a Facebook Page.
 */
@Injectable()
export class InstagramPublisher implements Publisher {
  readonly platform: Platform = "instagram";
  private readonly logger = new Logger(InstagramPublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as InstagramCreds | null;
    if (!creds?.ig_user_id || !creds?.page_access_token) {
      throw new Error("Instagram connection missing ig_user_id or page_access_token");
    }

    const caption = ctx.broadcast.content || "";
    const photo = ctx.broadcast.image_url;
    const video = ctx.broadcast.video_url;
    if (!photo && !video) {
      throw new Error("Instagram requires an image_url or video_url");
    }

    const containerParams = new URLSearchParams({
      access_token: creds.page_access_token,
      caption,
    });
    if (video) {
      containerParams.set("media_type", "REELS");
      containerParams.set("video_url", video);
    } else if (photo) {
      containerParams.set("image_url", photo);
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v20.0/${creds.ig_user_id}/media?${containerParams.toString()}`,
      { method: "POST" },
    );
    const containerJson: any = await containerRes.json().catch(() => ({}));
    if (!containerRes.ok || containerJson.error) {
      throw new Error(`Instagram container error: ${containerJson?.error?.message || containerRes.statusText}`);
    }
    const creationId: string = containerJson.id;

    if (video) {
      // Polling: wait until container is FINISHED (max ~60s).
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(
          `https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${encodeURIComponent(
            creds.page_access_token,
          )}`,
        );
        const statusJson: any = await statusRes.json().catch(() => ({}));
        if (statusJson.status_code === "FINISHED") break;
        if (statusJson.status_code === "ERROR") {
          throw new Error(`Instagram media processing failed: ${statusJson?.error?.message || "ERROR"}`);
        }
      }
    }

    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${creds.ig_user_id}/media_publish?creation_id=${encodeURIComponent(
        creationId,
      )}&access_token=${encodeURIComponent(creds.page_access_token)}`,
      { method: "POST" },
    );
    const publishJson: any = await publishRes.json().catch(() => ({}));
    if (!publishRes.ok || publishJson.error) {
      throw new Error(`Instagram publish error: ${publishJson?.error?.message || publishRes.statusText}`);
    }

    const id = publishJson.id;
    let externalUrl: string | undefined;
    if (id) {
      const permRes = await fetch(
        `https://graph.facebook.com/v20.0/${id}?fields=permalink&access_token=${encodeURIComponent(
          creds.page_access_token,
        )}`,
      );
      const permJson: any = await permRes.json().catch(() => ({}));
      externalUrl = permJson.permalink;
    }

    return { external_id: id ? String(id) : undefined, external_url: externalUrl };
  }

  /** For a given user token + page id, find the linked IG Business account. */
  static async findIgBusinessId(pageId: string, pageAccessToken: string): Promise<string | null> {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(
        pageAccessToken,
      )}`,
    );
    const json: any = await res.json().catch(() => ({}));
    return json?.instagram_business_account?.id || null;
  }
}
