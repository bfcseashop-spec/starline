import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface YouTubeCreds {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * YouTube Data API v3 — videos.insert with resumable upload.
 * Streams the broadcast video_url to YouTube as a video upload.
 */
@Injectable()
export class YouTubePublisher implements Publisher {
  readonly platform: Platform = "youtube";
  private readonly logger = new Logger(YouTubePublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as YouTubeCreds | null;
    if (!creds?.access_token) {
      throw new Error("YouTube connection missing access_token");
    }
    const videoUrl = ctx.broadcast.video_url;
    if (!videoUrl) {
      throw new Error("YouTube requires a video_url");
    }

    const title = (ctx.broadcast.content || "Untitled").split("\n")[0].slice(0, 100);
    const description = ctx.broadcast.content || "";

    const metadata = {
      snippet: { title, description, categoryId: "22" },
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/*",
        },
        body: JSON.stringify(metadata),
      },
    );
    if (!initRes.ok) {
      const errText = await initRes.text().catch(() => "");
      throw new Error(`YouTube init upload failed (${initRes.status}): ${errText.slice(0, 300)}`);
    }
    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) throw new Error("YouTube upload session URL missing");

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok || !videoRes.body) {
      throw new Error(`Failed to fetch source video (${videoRes.status})`);
    }
    const buf = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": videoRes.headers.get("content-type") || "video/mp4",
        "Content-Length": String(buf.byteLength),
      },
      body: buf,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(`YouTube upload failed (${uploadRes.status}): ${errText.slice(0, 300)}`);
    }
    const json: any = await uploadRes.json().catch(() => ({}));
    const id = json.id;
    return {
      external_id: id ? String(id) : undefined,
      external_url: id ? `https://youtu.be/${id}` : undefined,
    };
  }
}
