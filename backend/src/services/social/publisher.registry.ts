import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Platform, Publisher } from "./types";
import { TelegramPublisher } from "./publishers/telegram.publisher";
import { WebsitePublisher } from "./publishers/website.publisher";
import { FacebookPublisher } from "./publishers/facebook.publisher";
import { InstagramPublisher } from "./publishers/instagram.publisher";
import { LinkedInPublisher } from "./publishers/linkedin.publisher";
import { YouTubePublisher } from "./publishers/youtube.publisher";
import { TwitterPublisher } from "./publishers/twitter.publisher";
import { TikTokPublisher } from "./publishers/tiktok.publisher";
import { WhatsAppPublisher } from "./publishers/whatsapp.publisher";

@Injectable()
export class PublisherRegistry {
  private readonly publishers = new Map<Platform, Publisher>();

  constructor(
    telegram: TelegramPublisher,
    website: WebsitePublisher,
    facebook: FacebookPublisher,
    instagram: InstagramPublisher,
    linkedin: LinkedInPublisher,
    youtube: YouTubePublisher,
    twitter: TwitterPublisher,
    tiktok: TikTokPublisher,
    whatsapp: WhatsAppPublisher,
  ) {
    for (const p of [telegram, website, facebook, instagram, linkedin, youtube, twitter, tiktok, whatsapp]) {
      this.publishers.set(p.platform, p);
    }
  }

  get(platform: Platform): Publisher | null {
    return this.publishers.get(platform) || null;
  }

  has(platform: Platform): boolean {
    return this.publishers.has(platform);
  }
}
