# Social Broadcasting

This module lets an admin compose **one** post in the dashboard and fan it out to many social platforms.

> Architecture summary, schema, and rollout phases live in
> `.cursor/plans/multi-platform_social_broadcast_*.plan.md` (the source-of-truth design doc).
> This file is the **operator** README — what env vars to set, what each platform needs, and what to expect in production.

## Pieces

- DB tables: `social_connections`, `social_broadcasts`, `social_broadcast_targets`, `social_audit_log` (defined in [`backend/sql/init.sql`](../backend/sql/init.sql)).
- Backend module: [`backend/src/modules/social/`](../backend/src/modules/social/) + services in [`backend/src/services/social/`](../backend/src/services/social/).
- Frontend: [`src/components/admin/AdminSocialMedia.tsx`](../src/components/admin/AdminSocialMedia.tsx) and the API client at [`src/lib/socialApi.ts`](../src/lib/socialApi.ts).
- Per-platform "publishers" implementing a common `Publisher` interface — easy to swap or add new ones.
- An in-process scheduler that runs every minute and drains pending targets. Safe to replace with BullMQ later without touching publishers.

## Required env vars

Copy the new section from `.env.example`. **At minimum** set `SOCIAL_ENCRYPTION_KEY` (32 random bytes hex) — without it, all stored tokens fall back to a derivation of `JWT_SECRET`, which is fine for development but not for production.

| Var | What it's for |
|---|---|
| `SOCIAL_ENCRYPTION_KEY` | AES-256-GCM key for stored tokens. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PUBLIC_API_URL` | Where OAuth providers redirect back. Must be reachable by the user's browser. |
| `PUBLIC_APP_URL` | The admin UI origin — the OAuth popup `postMessage`s here on completion. |
| `META_APP_ID`, `META_APP_SECRET` | Facebook + Instagram (Meta Graph API) |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | YouTube uploads |
| `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_ENABLED=true` | Twitter / X (paid Basic tier required) |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok Content Posting API (invite-only) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DEFAULT_CHAT_ID` | Optional defaults — admins can paste these per connection |
| `PLAYWRIGHT_PROFILES_DIR` | Where WhatsApp Web persistent profiles live (default `./playwright-profiles`) |

## Per-platform notes

### Telegram (Phase 1, ready)
- Free, official Bot API. No OAuth.
- `@BotFather` → create bot → add as admin to channel/group.
- Connect form takes the bot token + chat id (`@channelname` or `-100…`).

### Website (Phase 1, ready)
- "Internal" connection — no auth needed. Posts are inserted as `social_media_posts` rows.

### Facebook + Instagram (Phase 2, ready)
- Set up a Meta app with **Pages**, **Page Posts**, and **Instagram Graph API** products.
- OAuth scopes used: `pages_show_list,pages_read_engagement,pages_manage_posts` (FB) plus `instagram_basic,instagram_content_publish` (IG).
- IG requires a Business account **linked to a Facebook Page**.
- Whitelisted redirect URI: `${PUBLIC_API_URL}/api/social/oauth/facebook/callback` (and `/instagram/callback`).

### LinkedIn (Phase 2, ready)
- Requires Marketing Developer Platform access for organization posts; for personal profile posts the standard `w_member_social` scope is enough.
- Image attachments use the `ARTICLE` shareMediaCategory (URL-based) for simplicity. Native binary uploads are a 3-step API call — TODO if needed.

### YouTube (Phase 3, ready)
- Uploads via Data API v3 (resumable upload, `videos.insert`).
- Daily quota: 10 000 units; an upload costs 1 600. So ~6 uploads/day per project unless you request a quota increase.
- Publishing only accepts a `video_url` (we download it server-side, then PUT to YouTube). Add storage handling if your videos are large.

### Twitter / X (Phase 3, gated)
- Disabled by default. Set `TWITTER_ENABLED=true` once you've subscribed to the paid Basic tier.
- Publisher uses OAuth 2.0 PKCE; we use a placeholder `code_challenge=challenge` for simplicity. Replace with random PKCE if you care.

### TikTok (Phase 3, invite required)
- Content Posting API access is invite-only as of 2024.
- Requires your account/app to be allow-listed by TikTok. The publisher uses `PULL_FROM_URL` (no upload session needed).

### WhatsApp Status (Phase 4, automation)
- **Unofficial.** Uses Playwright + WhatsApp Web. May break without notice.
- Install Playwright once on the server: `cd backend && npm i playwright && npx playwright install chromium`.
- Connect flow: admin clicks **Add WhatsApp account** → server boots a headless Chromium → captures the QR canvas every ~3s → frontend polls `/api/social/connections/:id/whatsapp/status` → admin scans on phone → cookies persist in `${PLAYWRIGHT_PROFILES_DIR}/wa_<connection_id>/`.
- Use a dedicated phone number. Mainline numbers can get banned.

## How a broadcast travels through the system

1. Admin clicks **New Broadcast** → multi-select checkboxes show one row per **active connection** (plus the internal Website channel).
2. `POST /api/social/broadcasts` inserts one `social_broadcasts` row + N `social_broadcast_targets` rows.
3. The HTTP handler kicks `BroadcastService.runDueTargets()` immediately for instant publishing, and the scheduler ticks every 60 s for any scheduled posts.
4. Each target is dispatched to a `Publisher` keyed by platform. The publisher returns `{external_id, external_url}` on success or throws on failure.
5. The target row gets `status` + `external_url` + `error_message`. Aggregated, this rolls up into the broadcast's `status` (pending → publishing → completed / partial / failed).
6. The UI re-fetches every 12 s and shows per-target status chips. Failed chips have a retry icon that flips the target back to `pending`.

## Where to extend

- **Add a new platform**: drop a new file in `backend/src/services/social/publishers/` that implements `Publisher`, register it in `PublisherRegistry`, add it to `PLATFORM_INFO`, and add OAuth handling in `SocialOAuthService` if applicable. The frontend picks up the new platform automatically via `/api/social/platforms`.
- **Token refresh**: extend `SocialSchedulerService.tick` to also iterate connections nearing `expires_at` and refresh them via the relevant OAuth endpoint. (Phase-2 OAuth flow already records `expires_at` and refresh tokens where the platform supports them.)
- **Queue / scaling**: replace the in-process `setInterval` in `SocialSchedulerService` with BullMQ workers. The publisher interface and target-row state machine don't need to change.

## Why we did NOT take the "server captures cookies for FB / IG / Twitter" path

- It violates Meta / X / LinkedIn / TikTok TOS — accounts get flagged from datacenter IPs, often within hours.
- Selectors break every few weeks when those platforms redesign.
- 2FA, CAPTCHA, and "suspicious login" emails block server-side login on first attempt.
- Streaming a remote browser into the admin panel (so you can solve those challenges) requires a third-party remote-browser product like Hyperbeam / Browserless / BrightData (~ $$ /month), or self-hosted noVNC.
- All of these are unnecessary because the platforms above offer official OAuth APIs that are stable, free (except Twitter), and never get accounts banned.

WhatsApp is the only intentional exception, because it has no official "post to feed" surface and has historically tolerated a single Web session per number.
