import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import { SocialConnectionService } from "./connection.service";
import { FacebookPublisher } from "./publishers/facebook.publisher";
import { InstagramPublisher } from "./publishers/instagram.publisher";
import type { Platform } from "./types";

interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  scope: string;
  responseType?: string;
  extraAuthParams?: Record<string, string>;
}

const SUPPORTED_OAUTH_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin", "youtube", "twitter", "tiktok"];

@Injectable()
export class SocialOAuthService {
  private readonly logger = new Logger(SocialOAuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly connections: SocialConnectionService,
  ) {}

  isSupported(platform: string): platform is Platform {
    return SUPPORTED_OAUTH_PLATFORMS.includes(platform as Platform);
  }

  buildAuthUrl(platform: Platform, actorId: string | null): { url: string; state: string } | null {
    const cfg = this.providerConfig(platform);
    if (!cfg || !cfg.clientId) return null;
    const state = this.jwt.sign(
      { p: platform, actor: actorId, n: randomUUID() },
      { expiresIn: "15m" },
    );
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: this.redirectUri(platform),
      response_type: cfg.responseType || "code",
      scope: cfg.scope,
      state,
      ...(cfg.extraAuthParams || {}),
    });
    return { url: `${cfg.authUrl}?${params.toString()}`, state };
  }

  redirectUri(platform: Platform): string {
    const base = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.API_PORT || 4042}`).replace(/\/$/, "");
    return `${base}/api/social/oauth/${platform}/callback`;
  }

  /** Validates and returns the actorId encoded in the OAuth state JWT. */
  verifyState(token: string, expectedPlatform: Platform): string | null {
    try {
      const decoded = this.jwt.verify(token) as { p: Platform; actor: string | null };
      if (decoded.p !== expectedPlatform) return null;
      return decoded.actor;
    } catch {
      return null;
    }
  }

  /** Exchange auth code -> tokens, then persist a connection and return its id. */
  async exchangeAndStore(
    platform: Platform,
    code: string,
    actorId: string | null,
  ): Promise<{ id: string; account_label: string | null } | { error: string }> {
    try {
      switch (platform) {
        case "facebook":
        case "instagram":
          return await this.handleMeta(platform, code, actorId);
        case "linkedin":
          return await this.handleLinkedIn(code, actorId);
        case "youtube":
          return await this.handleGoogle(code, actorId);
        case "twitter":
          return await this.handleTwitter(code, actorId);
        case "tiktok":
          return await this.handleTikTok(code, actorId);
        default:
          return { error: `Unsupported OAuth platform: ${platform}` };
      }
    } catch (err) {
      const msg = (err as Error).message || String(err);
      this.logger.error(`OAuth exchange failed for ${platform}: ${msg}`);
      return { error: msg };
    }
  }

  private providerConfig(platform: Platform): ProviderConfig | null {
    switch (platform) {
      case "facebook":
      case "instagram":
        return {
          authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
          tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
          clientId: process.env.META_APP_ID,
          clientSecret: process.env.META_APP_SECRET,
          scope:
            platform === "instagram"
              ? "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts"
              : "pages_show_list,pages_read_engagement,pages_manage_posts",
        };
      case "linkedin":
        return {
          authUrl: "https://www.linkedin.com/oauth/v2/authorization",
          tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          scope: "w_member_social r_liteprofile",
        };
      case "youtube":
        return {
          authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
          extraAuthParams: { access_type: "offline", prompt: "consent" },
        };
      case "twitter":
        return {
          authUrl: "https://twitter.com/i/oauth2/authorize",
          tokenUrl: "https://api.twitter.com/2/oauth2/token",
          clientId: process.env.TWITTER_CLIENT_ID,
          clientSecret: process.env.TWITTER_CLIENT_SECRET,
          scope: "tweet.read tweet.write users.read offline.access",
          extraAuthParams: { code_challenge: "challenge", code_challenge_method: "plain" },
        };
      case "tiktok":
        return {
          authUrl: "https://www.tiktok.com/v2/auth/authorize/",
          tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
          clientId: process.env.TIKTOK_CLIENT_KEY,
          clientSecret: process.env.TIKTOK_CLIENT_SECRET,
          scope: "user.info.basic,video.publish,video.upload",
        };
      default:
        return null;
    }
  }

  private async handleMeta(platform: Platform, code: string, actorId: string | null) {
    const cfg = this.providerConfig(platform)!;
    if (!cfg.clientId || !cfg.clientSecret) {
      throw new Error("META_APP_ID / META_APP_SECRET not configured");
    }
    const tokenRes = await fetch(
      `${cfg.tokenUrl}?client_id=${encodeURIComponent(cfg.clientId)}` +
        `&client_secret=${encodeURIComponent(cfg.clientSecret)}` +
        `&redirect_uri=${encodeURIComponent(this.redirectUri(platform))}` +
        `&code=${encodeURIComponent(code)}`,
    );
    const tokenJson: any = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || tokenJson.error) {
      throw new Error(`Meta token exchange failed: ${tokenJson?.error?.message || tokenRes.statusText}`);
    }

    const exchange = await FacebookPublisher.exchangeForPageTokens(
      cfg.clientId,
      cfg.clientSecret,
      tokenJson.access_token,
    );
    if (!exchange.pages.length) {
      throw new Error(
        "No manageable Facebook Pages found. Make sure the user has a Page and granted page access.",
      );
    }

    // Pick the first page by default. UI can later let the admin pick which.
    const page = exchange.pages[0];

    if (platform === "facebook") {
      const conn = await this.connections.upsert({
        platform: "facebook",
        account_label: page.name,
        account_external_id: page.id,
        credentials: { page_id: page.id, page_access_token: page.access_token, user_access_token: exchange.longLivedUserToken },
        meta: { all_pages: exchange.pages.map((p) => ({ id: p.id, name: p.name })) },
        expires_at: new Date(Date.now() + exchange.expires_in * 1000).toISOString(),
        created_by: actorId,
      });
      return { id: conn.id, account_label: conn.account_label };
    }

    // Instagram: find IG Business account linked to a page
    let igUserId: string | null = null;
    let igPage = page;
    for (const p of exchange.pages) {
      const id = await InstagramPublisher.findIgBusinessId(p.id, p.access_token);
      if (id) {
        igUserId = id;
        igPage = p;
        break;
      }
    }
    if (!igUserId) {
      throw new Error(
        "No Instagram Business account linked to the selected Facebook Pages. " +
          "Convert your IG account to Business and link it to a Facebook Page.",
      );
    }
    const conn = await this.connections.upsert({
      platform: "instagram",
      account_label: igPage.name,
      account_external_id: igUserId,
      credentials: { ig_user_id: igUserId, page_access_token: igPage.access_token, page_id: igPage.id },
      meta: { page_id: igPage.id, page_name: igPage.name },
      expires_at: new Date(Date.now() + exchange.expires_in * 1000).toISOString(),
      created_by: actorId,
    });
    return { id: conn.id, account_label: conn.account_label };
  }

  private async handleLinkedIn(code: string, actorId: string | null) {
    const cfg = this.providerConfig("linkedin")!;
    if (!cfg.clientId || !cfg.clientSecret) throw new Error("LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET not configured");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri("linkedin"),
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${json.error_description || res.statusText}`);

    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${json.access_token}` },
    });
    const meJson: any = await meRes.json().catch(() => ({}));
    const sub = meJson.sub;
    const author_urn = sub ? `urn:li:person:${sub}` : null;

    const conn = await this.connections.upsert({
      platform: "linkedin",
      account_label: meJson.name || meJson.email || "LinkedIn",
      account_external_id: sub || null,
      credentials: { access_token: json.access_token, refresh_token: json.refresh_token, author_urn },
      meta: { profile: meJson },
      expires_at: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
      created_by: actorId,
    });
    return { id: conn.id, account_label: conn.account_label };
  }

  private async handleGoogle(code: string, actorId: string | null) {
    const cfg = this.providerConfig("youtube")!;
    if (!cfg.clientId || !cfg.clientSecret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri("youtube"),
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Google token exchange failed: ${json.error_description || res.statusText}`);

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${json.access_token}` } },
    );
    const channelJson: any = await channelRes.json().catch(() => ({}));
    const channel = channelJson?.items?.[0];

    const conn = await this.connections.upsert({
      platform: "youtube",
      account_label: channel?.snippet?.title || "YouTube",
      account_external_id: channel?.id || null,
      credentials: {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
      },
      meta: { channel_id: channel?.id, channel_title: channel?.snippet?.title },
      expires_at: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
      created_by: actorId,
    });
    return { id: conn.id, account_label: conn.account_label };
  }

  private async handleTwitter(code: string, actorId: string | null) {
    const cfg = this.providerConfig("twitter")!;
    if (!cfg.clientId || !cfg.clientSecret) throw new Error("TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET not configured");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri("twitter"),
      client_id: cfg.clientId,
      code_verifier: "challenge",
    });
    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Twitter token exchange failed: ${JSON.stringify(json)}`);

    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${json.access_token}` },
    });
    const meJson: any = await meRes.json().catch(() => ({}));
    const user = meJson?.data;

    const conn = await this.connections.upsert({
      platform: "twitter",
      account_label: user?.username ? `@${user.username}` : "Twitter",
      account_external_id: user?.id || null,
      credentials: {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
        username: user?.username,
        user_id: user?.id,
      },
      meta: { user },
      expires_at: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
      created_by: actorId,
    });
    return { id: conn.id, account_label: conn.account_label };
  }

  private async handleTikTok(code: string, actorId: string | null) {
    const cfg = this.providerConfig("tiktok")!;
    if (!cfg.clientId || !cfg.clientSecret) throw new Error("TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET not configured");

    const body = new URLSearchParams({
      client_key: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri("tiktok"),
    });
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(`TikTok token exchange failed: ${json.error_description || JSON.stringify(json)}`);

    const conn = await this.connections.upsert({
      platform: "tiktok",
      account_label: "TikTok",
      account_external_id: json.open_id || null,
      credentials: {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
        open_id: json.open_id,
      },
      meta: { scope: json.scope },
      expires_at: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
      created_by: actorId,
    });
    return { id: conn.id, account_label: conn.account_label };
  }
}
