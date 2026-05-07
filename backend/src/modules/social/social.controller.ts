import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { SocialConnectionService } from "../../services/social/connection.service";
import { BroadcastService, type CreateBroadcastInput } from "../../services/social/broadcast.service";
import { SocialOAuthService } from "../../services/social/oauth.service";
import { TelegramPublisher } from "../../services/social/publishers/telegram.publisher";
import { WhatsAppDriver } from "../../services/social/whatsapp.driver";
import { PLATFORM_INFO } from "../../services/social/platform-info";
import { ALL_PLATFORMS, type Platform } from "../../services/social/types";
import { AuthService } from "../../services/auth.service";

function getActorId(authHeader: string | undefined, auth: AuthService): string | null {
  if (!authHeader) return null;
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const payload = auth.verify(token) as any;
    return payload?.sub || null;
  } catch {
    return null;
  }
}

@Controller("api/social")
export class SocialController {
  constructor(
    private readonly connections: SocialConnectionService,
    private readonly broadcasts: BroadcastService,
    private readonly oauth: SocialOAuthService,
    private readonly telegram: TelegramPublisher,
    private readonly whatsapp: WhatsAppDriver,
    private readonly auth: AuthService,
  ) {}

  @Get("platforms")
  platforms() {
    return {
      data: ALL_PLATFORMS.map((id) => ({
        ...PLATFORM_INFO[id],
        oauth_configured: this.isOauthConfigured(id),
        twitter_enabled: id === "twitter" ? process.env.TWITTER_ENABLED === "true" : undefined,
      })),
    };
  }

  private isOauthConfigured(platform: Platform): boolean {
    switch (platform) {
      case "facebook":
      case "instagram":
        return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
      case "linkedin":
        return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
      case "youtube":
        return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
      case "twitter":
        return !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);
      case "tiktok":
        return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
      default:
        return false;
    }
  }

  @Get("connections")
  async listConnections(@Query("platform") platform?: string) {
    const rows = await this.connections.list(platform as Platform | undefined);
    return { data: rows.map((r) => this.connections.toPublic(r)) };
  }

  @Delete("connections/:id")
  async deleteConnection(@Param("id") id: string, @Headers("authorization") auth = "") {
    const actorId = getActorId(auth, this.auth);
    await this.connections.remove(id, actorId);
    return { data: { ok: true } };
  }

  @Post("connections/telegram")
  async connectTelegram(
    @Body() body: { bot_token: string; chat_id: string; account_label?: string },
    @Headers("authorization") auth = "",
  ) {
    const actorId = getActorId(auth, this.auth);
    if (!body?.bot_token || !body?.chat_id) {
      throw new BadRequestException("bot_token and chat_id are required");
    }
    const { bot, chat } = await this.telegram.validate({
      bot_token: body.bot_token,
      chat_id: body.chat_id,
    });
    const label = body.account_label || chat?.title || chat?.username || "Telegram channel";
    const conn = await this.connections.upsert({
      platform: "telegram",
      account_label: label,
      account_external_id: String(chat?.id || body.chat_id),
      credentials: { bot_token: body.bot_token, chat_id: String(chat?.id || body.chat_id) },
      meta: { bot_username: bot?.username, chat_type: chat?.type, chat_title: chat?.title },
      created_by: actorId,
    });
    return { data: this.connections.toPublic(conn) };
  }

  @Get("oauth/:platform/start")
  async oauthStart(
    @Param("platform") platform: string,
    @Headers("authorization") auth = "",
    @Res() res: Response,
  ) {
    if (!this.oauth.isSupported(platform)) {
      throw new BadRequestException(`OAuth not supported for ${platform}`);
    }
    const actorId = getActorId(auth, this.auth);
    const built = this.oauth.buildAuthUrl(platform as Platform, actorId);
    if (!built) {
      throw new HttpException(
        { error: `OAuth credentials for ${platform} are not configured on the server.` },
        400,
      );
    }
    return res.redirect(built.url);
  }

  @Get("oauth/:platform/callback")
  async oauthCallback(
    @Param("platform") platform: string,
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Res() res: Response,
  ) {
    const appUrl = (process.env.PUBLIC_APP_URL || "http://localhost:5174").replace(/\/$/, "");
    if (!this.oauth.isSupported(platform)) {
      return res.send(this.popupClose(appUrl, { ok: false, error: `Unsupported: ${platform}` }));
    }
    if (error) {
      return res.send(this.popupClose(appUrl, { ok: false, error: errorDescription || error }));
    }
    const actorId = this.oauth.verifyState(state || "", platform as Platform);
    if (actorId === null && state) {
      return res.send(this.popupClose(appUrl, { ok: false, error: "Invalid OAuth state token" }));
    }
    const result = await this.oauth.exchangeAndStore(platform as Platform, code, actorId);
    if ("error" in result) {
      return res.send(this.popupClose(appUrl, { ok: false, error: result.error }));
    }
    return res.send(
      this.popupClose(appUrl, { ok: true, platform, connection_id: result.id, account_label: result.account_label }),
    );
  }

  private popupClose(appUrl: string, payload: Record<string, any>): string {
    const json = JSON.stringify(payload).replace(/</g, "\\u003c");
    return `<!doctype html><html><head><title>Connecting…</title></head><body style="font-family:system-ui;padding:24px;text-align:center">
<p>${payload.ok ? "Connected!" : "Connection failed"}</p>
${payload.ok ? "" : `<p style="color:#c00;font-size:13px">${String(payload.error || "").replace(/</g, "&lt;")}</p>`}
<p style="font-size:13px;color:#666">You can close this window.</p>
<script>(function(){
  try { if (window.opener) { window.opener.postMessage({type:'starline_social_oauth', payload: ${json}}, ${JSON.stringify(appUrl)}); } } catch(e) {}
  setTimeout(function(){ try { window.close(); } catch(e) {} }, 600);
})();</script>
</body></html>`;
  }

  @Post("connections/:id/whatsapp/login")
  async startWhatsAppLogin(@Param("id") id: string) {
    const conn = await this.connections.findById(id);
    if (!conn || conn.platform !== "whatsapp") {
      throw new BadRequestException("WhatsApp connection not found");
    }
    const session = await this.whatsapp.startLogin(conn.id);
    return { data: { status: session.status, qr: session.lastQr ?? null, error: session.error ?? null } };
  }

  @Get("connections/:id/whatsapp/status")
  async whatsAppStatus(@Param("id") id: string) {
    const session = this.whatsapp.getSession(id);
    if (!session) {
      const conn = await this.connections.findById(id);
      return { data: { status: conn ? "idle" : "missing", qr: null, error: null } };
    }
    if (session.status === "authenticated") {
      await this.connections.setStatus(id, "active", null);
    } else if (session.status === "error" && session.error) {
      await this.connections.setStatus(id, "error", session.error);
    }
    return { data: { status: session.status, qr: session.lastQr ?? null, error: session.error ?? null } };
  }

  @Post("connections/whatsapp")
  async createWhatsAppConnection(
    @Body() body: { account_label?: string },
    @Headers("authorization") auth = "",
  ) {
    const actorId = getActorId(auth, this.auth);
    const conn = await this.connections.upsert({
      platform: "whatsapp",
      account_label: body?.account_label || "WhatsApp Web",
      credentials: null,
      status: "needs_login",
      created_by: actorId,
    });
    return { data: this.connections.toPublic(conn) };
  }

  @Get("broadcasts")
  async listBroadcasts() {
    const broadcasts = await this.broadcasts.listBroadcasts();
    const targets = await this.broadcasts.listAllTargets();
    return {
      data: broadcasts.map((b) => ({
        ...b,
        targets: targets.filter((t) => t.broadcast_id === b.id),
      })),
    };
  }

  @Post("broadcasts")
  async createBroadcast(@Body() body: CreateBroadcastInput, @Headers("authorization") auth = "") {
    const actorId = getActorId(auth, this.auth);
    if (!body?.targets?.length) throw new BadRequestException("At least one target platform required");
    const result = await this.broadcasts.create({ ...body, created_by: actorId });
    setImmediate(() => {
      this.broadcasts.runDueTargets().catch(() => undefined);
    });
    return { data: result };
  }

  @Post("broadcasts/:id/cancel")
  async cancelBroadcast(@Param("id") id: string) {
    await this.broadcasts.cancel(id);
    return { data: { ok: true } };
  }

  @Delete("broadcasts/:id")
  async deleteBroadcast(@Param("id") id: string) {
    await this.broadcasts.deleteBroadcast(id);
    return { data: { ok: true } };
  }

  @Post("broadcasts/targets/:id/retry")
  async retryTarget(@Param("id") id: string) {
    await this.broadcasts.retryTarget(id);
    setImmediate(() => {
      this.broadcasts.executeTarget(id).catch(() => undefined);
    });
    return { data: { ok: true } };
  }
}
