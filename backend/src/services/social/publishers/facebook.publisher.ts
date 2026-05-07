import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";
import { SocialConnectionService } from "../connection.service";

interface FacebookCreds {
  page_id: string;
  page_access_token: string;
  /** User access token used to refresh the page token. Optional. */
  user_access_token?: string;
}

/**
 * Facebook Page posting via Meta Graph API.
 * Requires a Page access token with `pages_manage_posts` + `pages_read_engagement`.
 */
@Injectable()
export class FacebookPublisher implements Publisher {
  readonly platform: Platform = "facebook";
  private readonly logger = new Logger(FacebookPublisher.name);

  constructor(private readonly conns: SocialConnectionService) {}

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as FacebookCreds | null;
    if (!creds?.page_id || !creds?.page_access_token) {
      throw new Error("Facebook connection missing page_id or page_access_token");
    }

    const message = ctx.broadcast.content || "";
    const photo = ctx.broadcast.image_url;
    const video = ctx.broadcast.video_url;
    const link = ctx.broadcast.link;

    let path: string;
    const params = new URLSearchParams({ access_token: creds.page_access_token });
    const body: Record<string, any> = {};

    if (video) {
      path = `${creds.page_id}/videos`;
      body.file_url = video;
      if (message) body.description = message;
    } else if (photo) {
      path = `${creds.page_id}/photos`;
      body.url = photo;
      if (message) body.caption = message;
    } else {
      if (!message.trim() && !link) throw new Error("Facebook post requires text, link, or media");
      path = `${creds.page_id}/feed`;
      if (message) body.message = message;
      if (link) body.link = link;
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${path}?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(`Facebook Graph API error: ${json?.error?.message || res.statusText}`);
    }

    const id = json.post_id || json.id;
    const externalUrl = id ? `https://www.facebook.com/${id}` : undefined;
    return { external_id: id ? String(id) : undefined, external_url: externalUrl };
  }

  /** Exchange short-lived user token for a long-lived one + page tokens. */
  static async exchangeForPageTokens(
    appId: string,
    appSecret: string,
    shortLivedUserToken: string,
  ): Promise<{
    longLivedUserToken: string;
    expires_in: number;
    pages: Array<{ id: string; name: string; access_token: string; category?: string }>;
  }> {
    const llRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&fb_exchange_token=${encodeURIComponent(shortLivedUserToken)}`,
    );
    const llJson: any = await llRes.json();
    if (!llRes.ok || llJson.error) {
      throw new Error(`Failed to exchange token: ${llJson?.error?.message || llRes.statusText}`);
    }
    const longLivedUserToken: string = llJson.access_token;
    const expires_in: number = llJson.expires_in || 60 * 24 * 60 * 60;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${encodeURIComponent(longLivedUserToken)}`,
    );
    const pagesJson: any = await pagesRes.json();
    if (!pagesRes.ok || pagesJson.error) {
      throw new Error(`Failed to fetch pages: ${pagesJson?.error?.message || pagesRes.statusText}`);
    }
    return {
      longLivedUserToken,
      expires_in,
      pages: (pagesJson.data || []) as any[],
    };
  }
}
