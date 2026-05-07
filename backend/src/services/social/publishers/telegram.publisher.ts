import { Injectable, Logger } from "@nestjs/common";
import type { Platform, Publisher, PublishContext, PublishResult } from "../types";

interface TelegramCreds {
  bot_token: string;
  chat_id: string;
}

/**
 * Telegram Bot API. Free, official, no OAuth.
 * Admin pastes a bot token + channel/chat id from @BotFather.
 */
@Injectable()
export class TelegramPublisher implements Publisher {
  readonly platform: Platform = "telegram";
  private readonly logger = new Logger(TelegramPublisher.name);

  async publish(ctx: PublishContext): Promise<PublishResult> {
    const creds = ctx.credentials as TelegramCreds | null;
    if (!creds?.bot_token || !creds?.chat_id) {
      throw new Error("Telegram connection missing bot_token or chat_id");
    }

    const text = ctx.broadcast.content || "";
    const photo = ctx.broadcast.image_url || null;
    const video = ctx.broadcast.video_url || null;

    let endpoint: string;
    const body: Record<string, any> = {
      chat_id: creds.chat_id,
      parse_mode: "HTML",
    };

    if (video) {
      endpoint = "sendVideo";
      body.video = video;
      if (text) body.caption = text;
    } else if (photo) {
      endpoint = "sendPhoto";
      body.photo = photo;
      if (text) body.caption = text;
    } else {
      if (!text.trim()) throw new Error("Telegram post requires either text, image, or video");
      endpoint = "sendMessage";
      body.text = text;
      body.disable_web_page_preview = false;
    }

    const url = `https://api.telegram.org/bot${creds.bot_token}/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(`Telegram API error: ${json.description || res.statusText || "unknown"}`);
    }

    const messageId = json?.result?.message_id;
    const chat = json?.result?.chat;
    let externalUrl: string | undefined;
    if (messageId && chat?.username) {
      externalUrl = `https://t.me/${chat.username}/${messageId}`;
    }

    return {
      external_id: messageId ? String(messageId) : undefined,
      external_url: externalUrl,
    };
  }

  /** Validate creds by calling getMe + getChat. Used at connect time. */
  async validate(creds: TelegramCreds): Promise<{ bot: any; chat: any }> {
    if (!creds?.bot_token) throw new Error("Bot token required");
    if (!creds?.chat_id) throw new Error("Chat / channel id required");

    const meRes = await fetch(`https://api.telegram.org/bot${creds.bot_token}/getMe`);
    const meJson: any = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meJson.ok) {
      throw new Error(`Invalid bot token: ${meJson.description || meRes.statusText}`);
    }

    const chatRes = await fetch(
      `https://api.telegram.org/bot${creds.bot_token}/getChat?chat_id=${encodeURIComponent(creds.chat_id)}`,
    );
    const chatJson: any = await chatRes.json().catch(() => ({}));
    if (!chatRes.ok || !chatJson.ok) {
      throw new Error(
        `Cannot access chat "${creds.chat_id}": ${chatJson.description || chatRes.statusText}. ` +
          `Make sure the bot is added as an admin of the channel/group.`,
      );
    }

    return { bot: meJson.result, chat: chatJson.result };
  }
}
