import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SocialController } from "./social.controller";
import { DatabaseService } from "../../services/database.service";
import { AuthService } from "../../services/auth.service";
import { SocialConnectionService } from "../../services/social/connection.service";
import { BroadcastService } from "../../services/social/broadcast.service";
import { PublisherRegistry } from "../../services/social/publisher.registry";
import { SocialOAuthService } from "../../services/social/oauth.service";
import { SocialSchedulerService } from "../../services/social/scheduler.service";
import { TelegramPublisher } from "../../services/social/publishers/telegram.publisher";
import { WebsitePublisher } from "../../services/social/publishers/website.publisher";
import { FacebookPublisher } from "../../services/social/publishers/facebook.publisher";
import { InstagramPublisher } from "../../services/social/publishers/instagram.publisher";
import { LinkedInPublisher } from "../../services/social/publishers/linkedin.publisher";
import { YouTubePublisher } from "../../services/social/publishers/youtube.publisher";
import { TwitterPublisher } from "../../services/social/publishers/twitter.publisher";
import { TikTokPublisher } from "../../services/social/publishers/tiktok.publisher";
import { WhatsAppPublisher } from "../../services/social/publishers/whatsapp.publisher";
import { WhatsAppDriver } from "../../services/social/whatsapp.driver";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "starline-secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [SocialController],
  providers: [
    DatabaseService,
    AuthService,
    SocialConnectionService,
    BroadcastService,
    PublisherRegistry,
    SocialOAuthService,
    SocialSchedulerService,
    WhatsAppDriver,
    TelegramPublisher,
    WebsitePublisher,
    FacebookPublisher,
    InstagramPublisher,
    LinkedInPublisher,
    YouTubePublisher,
    TwitterPublisher,
    TikTokPublisher,
    WhatsAppPublisher,
  ],
})
export class SocialModule {}
