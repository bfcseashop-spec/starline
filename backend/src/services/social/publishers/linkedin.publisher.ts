import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface LinkedInCreds {
  access_token: string;
  /** "urn:li:person:..." or "urn:li:organization:..." */
  author_urn: string;
}

/**
 * LinkedIn UGC Posts API.
 * Scopes: w_member_social (personal) or w_organization_social (company page).
 */
@Injectable()
export class LinkedInPublisher implements Publisher {
  readonly platform: Platform = "linkedin";
  private readonly logger = new Logger(LinkedInPublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as LinkedInCreds | null;
    if (!creds?.access_token || !creds?.author_urn) {
      throw new Error("LinkedIn connection missing access_token or author_urn");
    }

    const text = ctx.broadcast.content || "";
    if (!text.trim()) {
      throw new Error("LinkedIn post requires text content");
    }

    const body: Record<string, any> = {
      author: creds.author_urn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    if (ctx.broadcast.image_url) {
      // LinkedIn requires a 3-step image upload. For simplicity we attach by URL via ARTICLE category.
      body.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "ARTICLE";
      body.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          originalUrl: ctx.broadcast.image_url,
          description: { text: text.slice(0, 200) },
          title: { text: text.slice(0, 80) || "Post" },
        },
      ];
    }

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LinkedIn API error (${res.status}): ${errText.slice(0, 300)}`);
    }
    const id = res.headers.get("x-restli-id") || (await res.json().catch(() => ({})))?.id;
    return {
      external_id: id ? String(id) : undefined,
      external_url: id ? `https://www.linkedin.com/feed/update/${id}/` : undefined,
    };
  }
}
