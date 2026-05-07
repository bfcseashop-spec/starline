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

export const ALL_PLATFORMS: Platform[] = [
  "facebook",
  "instagram",
  "telegram",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "whatsapp",
  "website",
];

export type ConnectionStatus =
  | "active"
  | "expired"
  | "needs_login"
  | "error"
  | "pending"
  | "disabled";

export type TargetStatus =
  | "pending"
  | "publishing"
  | "published"
  | "failed"
  | "skipped"
  | "cancelled";

export interface SocialConnectionRow {
  id: string;
  platform: Platform;
  account_label: string | null;
  account_external_id: string | null;
  credentials_enc: string | null;
  meta: Record<string, any> | null;
  status: ConnectionStatus;
  expires_at: string | null;
  last_error: string | null;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialBroadcastRow {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  link: string | null;
  scheduled_at: string | null;
  status: "pending" | "publishing" | "completed" | "partial" | "failed" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialBroadcastTargetRow {
  id: string;
  broadcast_id: string;
  connection_id: string | null;
  platform: Platform;
  status: TargetStatus;
  external_id: string | null;
  external_url: string | null;
  error_message: string | null;
  attempts: number;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishContext {
  broadcast: SocialBroadcastRow;
  target: SocialBroadcastTargetRow;
  connection: SocialConnectionRow;
  credentials: Record<string, any> | null;
}

export interface PublishResult {
  external_id?: string;
  external_url?: string;
}

export interface Publisher {
  platform: Platform;
  publish(ctx: PublishContext): Promise<PublishResult>;
}
