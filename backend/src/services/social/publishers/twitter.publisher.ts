import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface TwitterCreds {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user_id?: string;
  username?: string;
}

/**
 * Twitter / X — POST /2/tweets.
 * NOTE: posting is paid (Basic tier ~$100/mo as of 2024).
 * Disabled by default unless TWITTER_ENABLED=true.
 */
@Injectable()
export class TwitterPublisher implements Publisher {
  readonly platform: Platform = "twitter";
  private readonly logger = new Logger(TwitterPublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    if (process.env.TWITTER_ENABLED !== "true") {
      throw new Error(
        "Twitter / X publishing is disabled. Set TWITTER_ENABLED=true once you have an active paid API plan.",
      );
    }

    const creds = ctx.credentials as TwitterCreds | null;
    if (!creds?.access_token) {
      throw new Error("Twitter connection missing access_token");
    }

    const text = (ctx.broadcast.content || "").slice(0, 280);
    if (!text.trim()) {
      throw new Error("Twitter post requires text content");
    }

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.errors) {
      throw new Error(`Twitter API error: ${JSON.stringify(json.errors || json.detail || res.statusText)}`);
    }
    const id = json?.data?.id;
    return {
      external_id: id ? String(id) : undefined,
      external_url: id ? `https://twitter.com/${creds.username || "i"}/status/${id}` : undefined,
    };
  }
}
