import type { Platform } from "./types";

export interface PlatformInfo {
  id: Platform;
  label: string;
  /** "api" = official OAuth API, "manual" = user pastes credentials, "automation" = browser automation, "internal" = no credentials needed */
  connectKind: "api" | "manual" | "automation" | "internal";
  charLimit?: number;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsTextOnly: boolean;
  /** True when the implementation is gated/disabled by default. */
  experimental?: boolean;
  /** Short note shown in the connection card. */
  note?: string;
}

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  website: {
    id: "website",
    label: "Website",
    connectKind: "internal",
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
  },
  telegram: {
    id: "telegram",
    label: "Telegram",
    connectKind: "manual",
    charLimit: 4096,
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
    note: "Free Bot API. Create a bot via @BotFather and add it to your channel as admin.",
  },
  facebook: {
    id: "facebook",
    label: "Facebook Page",
    connectKind: "api",
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
    note: "Meta Graph API. Requires a Facebook Page and Meta app credentials.",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    connectKind: "api",
    charLimit: 2200,
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: false,
    note: "Requires an Instagram Business account linked to a Facebook Page.",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    connectKind: "api",
    charLimit: 3000,
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
    note: "Posts to a Company Page. Requires LinkedIn Marketing Developer access.",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    connectKind: "api",
    charLimit: 5000,
    supportsImage: false,
    supportsVideo: true,
    supportsTextOnly: false,
    note: "Uploads videos via Data API v3. Daily upload quota applies.",
  },
  twitter: {
    id: "twitter",
    label: "Twitter / X",
    connectKind: "api",
    charLimit: 280,
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
    experimental: true,
    note: "Requires Twitter API Basic tier (paid, ~$100/mo).",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    connectKind: "api",
    charLimit: 2200,
    supportsImage: false,
    supportsVideo: true,
    supportsTextOnly: false,
    experimental: true,
    note: "Requires TikTok Content Posting API access (invite-only).",
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp Status",
    connectKind: "automation",
    supportsImage: true,
    supportsVideo: true,
    supportsTextOnly: true,
    experimental: true,
    note: "Unofficial — uses WhatsApp Web automation. May break without notice. Use a dedicated number.",
  },
};

export function isExperimental(platform: Platform): boolean {
  return !!PLATFORM_INFO[platform]?.experimental;
}
