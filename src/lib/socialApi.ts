import { BACKEND_AUTH_TOKEN_KEY } from "@/lib/backendClient";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4042").replace(/\/$/, "");

export type Platform =
  | "facebook"
  | "instagram"
  | "telegram"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "whatsapp"
  | "website";

export interface PlatformInfo {
  id: Platform;
  label: string;
  connectKind: "api" | "manual" | "automation" | "internal";
  charLimit?: number;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsTextOnly: boolean;
  experimental?: boolean;
  note?: string;
  oauth_configured?: boolean;
  twitter_enabled?: boolean;
}

export interface SocialConnection {
  id: string;
  platform: Platform;
  account_label: string | null;
  account_external_id: string | null;
  meta: Record<string, any>;
  status: "active" | "expired" | "needs_login" | "error" | "pending" | "disabled";
  expires_at: string | null;
  last_error: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  credential_preview: Record<string, string>;
}

export interface BroadcastTarget {
  id: string;
  broadcast_id: string;
  connection_id: string | null;
  platform: Platform;
  status: "pending" | "publishing" | "published" | "failed" | "skipped" | "cancelled";
  external_id: string | null;
  external_url: string | null;
  error_message: string | null;
  attempts: number;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  link: string | null;
  scheduled_at: string | null;
  status: "draft" | "pending" | "publishing" | "completed" | "partial" | "failed" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  targets: BroadcastTarget[];
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
  const h: Record<string, string> = { ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...((opts.headers as Record<string, string>) || {}),
    }),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text };
  }
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || json?.error || res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return (json.data ?? json) as T;
}

export const socialApi = {
  listPlatforms: () => request<PlatformInfo[]>("/api/social/platforms"),
  listConnections: () => request<SocialConnection[]>("/api/social/connections"),
  deleteConnection: (id: string) =>
    request<{ ok: boolean }>(`/api/social/connections/${id}`, { method: "DELETE" }),

  connectTelegram: (body: { bot_token: string; chat_id: string; account_label?: string }) =>
    request<SocialConnection>("/api/social/connections/telegram", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  oauthStartUrl: (platform: Platform): string => {
    const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
    const sep = token ? "?" : "";
    const auth = token ? `access_token=${encodeURIComponent(token)}` : "";
    return `${API_URL}/api/social/oauth/${platform}/start${sep}${auth}`;
  },

  createWhatsAppConnection: (body: { account_label?: string }) =>
    request<SocialConnection>("/api/social/connections/whatsapp", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  startWhatsAppLogin: (id: string) =>
    request<{ status: string; qr: string | null; error: string | null }>(
      `/api/social/connections/${id}/whatsapp/login`,
      { method: "POST" },
    ),
  whatsAppStatus: (id: string) =>
    request<{ status: string; qr: string | null; error: string | null }>(
      `/api/social/connections/${id}/whatsapp/status`,
    ),

  listBroadcasts: () => request<Broadcast[]>("/api/social/broadcasts"),
  createBroadcast: (body: {
    content?: string | null;
    image_url?: string | null;
    video_url?: string | null;
    link?: string | null;
    scheduled_at?: string | null;
    status?: "draft" | "pending";
    targets: Array<{ platform: Platform; connection_id?: string }>;
  }) =>
    request<{ broadcast: Broadcast; targets: BroadcastTarget[] }>("/api/social/broadcasts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  cancelBroadcast: (id: string) =>
    request<{ ok: boolean }>(`/api/social/broadcasts/${id}/cancel`, { method: "POST" }),
  deleteBroadcast: (id: string) =>
    request<{ ok: boolean }>(`/api/social/broadcasts/${id}`, { method: "DELETE" }),
  retryTarget: (id: string) =>
    request<{ ok: boolean }>(`/api/social/broadcasts/targets/${id}/retry`, { method: "POST" }),
};
