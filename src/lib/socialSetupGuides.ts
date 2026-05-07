import type { Platform } from "./socialApi";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4042").replace(/\/$/, "");
const APP_URL = typeof window !== "undefined" ? window.location.origin : "";

export const callbackUrl = (platform: Platform): string =>
  `${API_URL}/api/social/oauth/${platform}/callback`;

export type GuideStepKind = "do" | "copy" | "scope" | "warn" | "link" | "note" | "env";

export interface GuideStep {
  kind: GuideStepKind;
  /** Markdown-ish: only **bold**, `code`, and [text](url) are processed (very lightweight). */
  text: string;
  copy?: string;
  href?: string;
}

export interface PlatformGuide {
  platform: Platform;
  /** Short one-liner shown at the top of the guide. */
  summary: string;
  /** Time / difficulty estimate, e.g. "~5 min, free". */
  estimate?: string;
  /** Optional warning shown above all steps. */
  caution?: string;
  /** Required env vars on the BACKEND for this integration. */
  envVars?: string[];
  /** Headlined step groups. */
  sections: {
    title: string;
    steps: GuideStep[];
  }[];
  /** Useful follow-up links (docs / consoles). */
  links?: { label: string; href: string }[];
}

export const SOCIAL_SETUP_GUIDES: Record<Platform, PlatformGuide | null> = {
  telegram: {
    platform: "telegram",
    summary: "Free, official Bot API. The bot posts to a channel you own as an admin.",
    estimate: "~3 min, free",
    sections: [
      {
        title: "1. Create the bot",
        steps: [
          { kind: "link", text: "Open **@BotFather** in Telegram", href: "https://t.me/BotFather" },
          { kind: "do", text: "Send `/newbot`, choose a display name, then a username (must end in `bot`, e.g. `starline_news_bot`)" },
          { kind: "copy", text: "BotFather replies with a token like `123456789:AAExample...`. Copy it.", copy: "" },
        ],
      },
      {
        title: "2. Add the bot to your channel",
        steps: [
          { kind: "do", text: "Open your channel → **Manage Channel** → **Administrators** → **Add Admin**" },
          { kind: "do", text: "Search for your bot by username and add it" },
          { kind: "scope", text: "Grant at least **Post Messages**, **Edit Messages**, and **Delete Messages**" },
        ],
      },
      {
        title: "3. Get the channel id",
        steps: [
          { kind: "do", text: "Easy way: open https://web.telegram.org, click your channel, the URL ends in `#-100...` — that whole `-100…` number is the chat id" },
          { kind: "do", text: "Or: post any message in the channel and visit `https://api.telegram.org/bot<TOKEN>/getUpdates` — find the `chat.id` field" },
          { kind: "note", text: "Public channels also accept `@channelname` instead of the numeric id" },
        ],
      },
      {
        title: "4. Connect below",
        steps: [
          { kind: "do", text: "Paste the **bot token** and **chat id** in the form and click Connect" },
        ],
      },
    ],
    links: [
      { label: "BotFather", href: "https://t.me/BotFather" },
      { label: "Telegram Bot API docs", href: "https://core.telegram.org/bots/api" },
    ],
  },

  facebook: {
    platform: "facebook",
    summary: "Posts to a Facebook Page (not a personal profile) via Meta Graph API.",
    estimate: "~15 min the first time, free",
    envVars: ["META_APP_ID", "META_APP_SECRET", "PUBLIC_API_URL"],
    sections: [
      {
        title: "1. Create a Meta app",
        steps: [
          { kind: "link", text: "Open the **Meta App Dashboard**", href: "https://developers.facebook.com/apps/" },
          { kind: "do", text: "Click **Create app** → choose use case **Other** → app type **Business** → continue" },
          { kind: "do", text: "Name the app and link it to a Business Portfolio (create one if needed)" },
        ],
      },
      {
        title: "2. Add Facebook Login + Pages",
        steps: [
          { kind: "do", text: "In the left nav: **Add product** → **Facebook Login for Business** → set up" },
          { kind: "do", text: "Also add the **Pages** product so the API can manage your Page" },
        ],
      },
      {
        title: "3. Configure OAuth redirect",
        steps: [
          { kind: "do", text: "Open **Facebook Login for Business → Settings → Valid OAuth Redirect URIs**" },
          { kind: "copy", text: "Paste this exact URL and save:", copy: callbackUrl("facebook") },
        ],
      },
      {
        title: "4. Request permissions",
        steps: [
          { kind: "do", text: "App Review → **Permissions and Features** → request these scopes:" },
          { kind: "scope", text: "`pages_show_list`" },
          { kind: "scope", text: "`pages_read_engagement`" },
          { kind: "scope", text: "`pages_manage_posts`" },
          { kind: "note", text: "While the app is in **Development** mode, you can use these scopes for any Page that you (the app admin) manage — no review needed. Switch to **Live** + complete review before adding outside users." },
        ],
      },
      {
        title: "5. Set backend env vars",
        steps: [
          { kind: "env", text: "Copy **App ID** and **App Secret** from **App Settings → Basic** into your `.env`" },
          { kind: "copy", text: "META_APP_ID=...", copy: "META_APP_ID=" },
          { kind: "copy", text: "META_APP_SECRET=...", copy: "META_APP_SECRET=" },
          { kind: "copy", text: "PUBLIC_API_URL=...", copy: `PUBLIC_API_URL=${API_URL}` },
          { kind: "do", text: "Restart the API process so the new vars are picked up" },
        ],
      },
      {
        title: "6. Click Connect Facebook below",
        steps: [
          { kind: "do", text: "A popup appears, you sign in, choose the Page(s) the bot can post to, and you're done. Tokens are stored encrypted." },
        ],
      },
    ],
    links: [
      { label: "Pages API: Getting Started", href: "https://developers.facebook.com/docs/pages-api/getting-started/" },
      { label: "App Dashboard", href: "https://developers.facebook.com/apps/" },
    ],
  },

  instagram: {
    platform: "instagram",
    summary: "Posts to Instagram via the Graph API. Requires a Business or Creator account linked to a Facebook Page.",
    estimate: "~15 min, free (requires the Facebook setup above)",
    envVars: ["META_APP_ID", "META_APP_SECRET", "PUBLIC_API_URL"],
    caution:
      "Instagram only allows posting from Business / Creator accounts. Personal IG accounts cannot post via API.",
    sections: [
      {
        title: "1. Make sure your Instagram account is Business",
        steps: [
          { kind: "do", text: "On the IG mobile app: **Settings → Account type and tools → Switch to professional account → Business**" },
          { kind: "do", text: "Link the account to a Facebook Page you own (the IG app guides you through this)" },
        ],
      },
      {
        title: "2. Reuse the Meta app from Facebook",
        steps: [
          { kind: "do", text: "Same Meta app as the Facebook Pages setup above. If you haven't done that, finish it first." },
          { kind: "do", text: "Add the **Instagram** product to the same app (left nav → Add product → Instagram)" },
        ],
      },
      {
        title: "3. Required permissions (NEW scope names)",
        steps: [
          { kind: "warn", text: "The OLD scopes `instagram_basic` / `instagram_content_publish` were **deprecated on Jan 27, 2025**. Use the new ones below." },
          { kind: "scope", text: "`instagram_business_basic`" },
          { kind: "scope", text: "`instagram_business_content_publish`" },
          { kind: "scope", text: "Plus the Page scopes from the Facebook setup (`pages_show_list`, `pages_read_engagement`, `pages_manage_posts`)" },
        ],
      },
      {
        title: "4. Same redirect URI as Facebook",
        steps: [
          { kind: "copy", text: "OAuth redirect URI:", copy: callbackUrl("instagram") },
          { kind: "do", text: "Add it to **Facebook Login for Business → Settings → Valid OAuth Redirect URIs**" },
        ],
      },
      {
        title: "5. Connect via the popup",
        steps: [
          { kind: "do", text: "When you click **Connect Instagram**, the consent screen will list your Pages — pick the one your IG Business account is linked to" },
          { kind: "note", text: "If the popup says \"no Instagram Business account found\", double-check the IG ↔ Facebook Page link in the IG app." },
        ],
      },
    ],
    links: [
      { label: "Instagram Platform overview", href: "https://developers.facebook.com/docs/instagram-platform/" },
      { label: "Business Login for Instagram", href: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/" },
    ],
  },

  linkedin: {
    platform: "linkedin",
    summary: "Post to your personal feed or to a Company Page. Uses LinkedIn's Posts API (replaces legacy ugcPosts).",
    estimate: "~10 min for personal posts. Company-page posting requires manual approval (~days to weeks).",
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "PUBLIC_API_URL"],
    sections: [
      {
        title: "1. Create a LinkedIn app",
        steps: [
          { kind: "link", text: "Open **LinkedIn Developer Portal**", href: "https://www.linkedin.com/developers/apps" },
          { kind: "do", text: "Click **Create app**. You'll need a Company Page that you administer (create one if needed)." },
        ],
      },
      {
        title: "2. Add products",
        steps: [
          { kind: "do", text: "Under **Products** add **Share on LinkedIn** (instant) for personal posting" },
          { kind: "note", text: "For posting on behalf of your **Company Page**, additionally request access to the **Marketing Developer Platform** (manual review)" },
        ],
      },
      {
        title: "3. Configure OAuth",
        steps: [
          { kind: "do", text: "Open the **Auth** tab → **OAuth 2.0 settings → Authorized redirect URLs for your app → Add redirect URL**" },
          { kind: "copy", text: "Paste this URL exactly:", copy: callbackUrl("linkedin") },
        ],
      },
      {
        title: "4. Required scopes",
        steps: [
          { kind: "scope", text: "`w_member_social` (post on the authenticated member's feed)" },
          { kind: "scope", text: "`r_liteprofile` (resolve the author URN)" },
          { kind: "scope", text: "`w_organization_social` — only if you've been approved for Marketing Developer Platform and want to post on a Company Page" },
        ],
      },
      {
        title: "5. Set backend env vars",
        steps: [
          { kind: "env", text: "Copy **Client ID** and **Client Secret** from **Auth → Application credentials**" },
          { kind: "copy", text: "LINKEDIN_CLIENT_ID=...", copy: "LINKEDIN_CLIENT_ID=" },
          { kind: "copy", text: "LINKEDIN_CLIENT_SECRET=...", copy: "LINKEDIN_CLIENT_SECRET=" },
          { kind: "do", text: "Restart the API and click **Connect LinkedIn** below" },
        ],
      },
    ],
    links: [
      { label: "LinkedIn Developer Portal", href: "https://www.linkedin.com/developers/apps" },
      { label: "Posts API docs", href: "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api" },
    ],
  },

  youtube: {
    platform: "youtube",
    summary: "Upload videos to a YouTube channel via the Data API v3 (resumable upload).",
    estimate: "~15 min. Free, but daily upload quota = ~6 videos/day until you request a quota increase.",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "PUBLIC_API_URL"],
    sections: [
      {
        title: "1. Google Cloud project",
        steps: [
          { kind: "link", text: "Open **Google Cloud Console**", href: "https://console.cloud.google.com/" },
          { kind: "do", text: "Create or select a project" },
          { kind: "do", text: "**APIs & Services → Library** → search **YouTube Data API v3** → **Enable**" },
        ],
      },
      {
        title: "2. OAuth consent screen",
        steps: [
          { kind: "do", text: "**APIs & Services → OAuth consent screen** → choose **External** → fill app name, support email, developer email" },
          { kind: "do", text: "Add the test users (your own Google account) while the app is in *Testing*; Google requires verification before broad use" },
          { kind: "scope", text: "Add scope: `.../auth/youtube.upload`" },
          { kind: "scope", text: "Add scope: `.../auth/youtube.readonly`" },
        ],
      },
      {
        title: "3. OAuth client ID",
        steps: [
          { kind: "do", text: "**APIs & Services → Credentials → Create Credentials → OAuth client ID**" },
          { kind: "do", text: "Application type: **Web application**" },
          { kind: "copy", text: "Authorized redirect URI:", copy: callbackUrl("youtube") },
          { kind: "copy", text: "Authorized JavaScript origin:", copy: APP_URL || "http://localhost:5174" },
        ],
      },
      {
        title: "4. Backend env vars",
        steps: [
          { kind: "copy", text: "GOOGLE_CLIENT_ID=...", copy: "GOOGLE_CLIENT_ID=" },
          { kind: "copy", text: "GOOGLE_CLIENT_SECRET=...", copy: "GOOGLE_CLIENT_SECRET=" },
          { kind: "do", text: "Restart the API and click **Connect YouTube** below" },
        ],
      },
      {
        title: "5. Quota",
        steps: [
          { kind: "warn", text: "Each video upload costs **1,600** quota units. Default daily quota is **10,000** → about 6 uploads/day. Request an increase from Google if you need more." },
        ],
      },
    ],
    links: [
      { label: "Google Cloud Console", href: "https://console.cloud.google.com/" },
      { label: "YouTube API auth guide", href: "https://developers.google.com/youtube/v3/guides/authentication" },
    ],
  },

  twitter: {
    platform: "twitter",
    summary: "Post tweets via X API v2. Posting requires a paid plan (Basic, ~$100/month as of 2026).",
    estimate: "~10 min after you've subscribed to Basic.",
    envVars: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "TWITTER_ENABLED", "PUBLIC_API_URL"],
    caution:
      "The free tier does NOT support posting. You must be on Basic ($100/mo) or higher to use this integration.",
    sections: [
      {
        title: "1. Sign up + subscribe",
        steps: [
          { kind: "link", text: "Open the **X Developer Portal**", href: "https://developer.x.com/" },
          { kind: "do", text: "Apply for a developer account, then in the Portal subscribe to **Basic** ($100/mo) — required for `POST /2/tweets`" },
        ],
      },
      {
        title: "2. Create a Project + App",
        steps: [
          { kind: "do", text: "Create a Project, then an App inside it" },
          { kind: "do", text: "**User authentication settings → Set up**" },
          { kind: "scope", text: "App permissions: **Read and write**" },
          { kind: "scope", text: "Type of App: **Web App, Automated App or Bot** (this enables OAuth 2.0 + Confidential client)" },
          { kind: "copy", text: "Callback URI / Redirect URL:", copy: callbackUrl("twitter") },
          { kind: "copy", text: "Website URL:", copy: APP_URL || "http://localhost:5174" },
        ],
      },
      {
        title: "3. Required scopes",
        steps: [
          { kind: "scope", text: "`tweet.read`" },
          { kind: "scope", text: "`tweet.write`" },
          { kind: "scope", text: "`users.read`" },
          { kind: "scope", text: "`offline.access` (so we can refresh tokens)" },
        ],
      },
      {
        title: "4. Backend env vars",
        steps: [
          { kind: "env", text: "From **Keys and tokens → OAuth 2.0 Client ID and Secret**" },
          { kind: "copy", text: "TWITTER_CLIENT_ID=...", copy: "TWITTER_CLIENT_ID=" },
          { kind: "copy", text: "TWITTER_CLIENT_SECRET=...", copy: "TWITTER_CLIENT_SECRET=" },
          { kind: "copy", text: "TWITTER_ENABLED=true (this gate prevents the publisher from running before you've paid)", copy: "TWITTER_ENABLED=true" },
          { kind: "do", text: "Restart the API and click **Connect Twitter** below" },
        ],
      },
    ],
    links: [
      { label: "X Developer Portal", href: "https://developer.x.com/" },
      { label: "Manage tweets quick start", href: "https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/quick-start" },
    ],
  },

  tiktok: {
    platform: "tiktok",
    summary: "Direct video posting via TikTok's Content Posting API.",
    estimate: "Approval is invite-style; expect days to weeks before public posting works.",
    envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "PUBLIC_API_URL"],
    caution:
      "Until your app is audited, every post is forced to PRIVATE (SELF_ONLY). Public posting requires a TikTok app review.",
    sections: [
      {
        title: "1. Developer app",
        steps: [
          { kind: "link", text: "Open **TikTok for Developers**", href: "https://developers.tiktok.com/" },
          { kind: "do", text: "Sign in → **Manage apps → Connect an app**, choose an organization as the owner" },
        ],
      },
      {
        title: "2. Add Content Posting API",
        steps: [
          { kind: "do", text: "In the app **Products** section → add **Content Posting API**" },
          { kind: "do", text: "Inside Content Posting API → enable **Direct Post** configuration" },
          { kind: "scope", text: "Request the `video.publish` scope (this is the part that takes review)" },
          { kind: "scope", text: "Also request `user.info.basic` so we can show the connected handle" },
        ],
      },
      {
        title: "3. Domain verification (for PULL_FROM_URL)",
        steps: [
          { kind: "warn", text: "TikTok pulls media from URLs you provide. The host serving those URLs must be **verified** in the TikTok app settings." },
          { kind: "do", text: "Verify your media-host domain (e.g. your CDN) in **App settings → URL prefix or verified domain**" },
        ],
      },
      {
        title: "4. OAuth redirect",
        steps: [
          { kind: "copy", text: "Redirect URI:", copy: callbackUrl("tiktok") },
        ],
      },
      {
        title: "5. Backend env vars",
        steps: [
          { kind: "copy", text: "TIKTOK_CLIENT_KEY=...", copy: "TIKTOK_CLIENT_KEY=" },
          { kind: "copy", text: "TIKTOK_CLIENT_SECRET=...", copy: "TIKTOK_CLIENT_SECRET=" },
          { kind: "do", text: "Restart the API and click **Connect TikTok** below" },
        ],
      },
    ],
    links: [
      { label: "TikTok for Developers", href: "https://developers.tiktok.com/" },
      { label: "Content Posting API", href: "https://developers.tiktok.com/doc/content-posting-api-get-started" },
    ],
  },

  whatsapp: {
    platform: "whatsapp",
    summary:
      "Posts to WhatsApp Status by automating WhatsApp Web with Playwright. Unofficial — there is no public API for WhatsApp Status.",
    estimate: "~5 min if Playwright is already installed.",
    envVars: ["PLAYWRIGHT_PROFILES_DIR"],
    caution:
      "Use a dedicated phone number. Heavy automation on a personal/business mainline number can lead to bans. WhatsApp may block this integration at any time without warning.",
    sections: [
      {
        title: "1. Install Playwright on the server",
        steps: [
          { kind: "copy", text: "From the project root:", copy: "cd backend && npm i playwright && npx playwright install chromium" },
          { kind: "note", text: "Playwright is loaded lazily — the API will boot without it; you only need this step before connecting WhatsApp." },
        ],
      },
      {
        title: "2. (Optional) Choose a profile dir",
        steps: [
          { kind: "env", text: "Persistent login cookies are stored on disk. Default location is `./playwright-profiles/` next to the API." },
          { kind: "copy", text: "PLAYWRIGHT_PROFILES_DIR=/var/lib/starline/wa", copy: "PLAYWRIGHT_PROFILES_DIR=" },
        ],
      },
      {
        title: "3. Connect from the admin UI",
        steps: [
          { kind: "do", text: "Click **Add WhatsApp account** below" },
          { kind: "do", text: "On your phone: **WhatsApp → Settings → Linked Devices → Link a Device** and scan the QR code shown" },
          { kind: "do", text: "When the QR disappears, the connection auto-saves and shows **ACTIVE**" },
        ],
      },
      {
        title: "4. Posting",
        steps: [
          { kind: "do", text: "Compose a broadcast and check **WhatsApp** in the platform list — it posts to your **Status**, not to a chat" },
        ],
      },
    ],
    links: [{ label: "WhatsApp Web", href: "https://web.whatsapp.com/" }],
  },

  website: {
    platform: "website",
    summary: "Internal channel — no setup needed. Posts to this platform are stored in your DB and rendered on the public site.",
    sections: [
      {
        title: "Already connected",
        steps: [
          { kind: "note", text: "There's nothing to configure. Selecting **Website** in a broadcast inserts a row into `social_media_posts` so the public-site components can pick it up." },
        ],
      },
    ],
  },
};

export function getGuide(platform: Platform): PlatformGuide | null {
  return SOCIAL_SETUP_GUIDES[platform] || null;
}
