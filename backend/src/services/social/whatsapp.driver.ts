import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { EventEmitter } from "node:events";

type AnyBrowserContext = any;
type AnyPage = any;

interface PlaywrightModule {
  chromium: { launchPersistentContext: (dir: string, options: any) => Promise<AnyBrowserContext> };
}

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  try {
    // Lazy load so the backend boots even when Playwright is not installed yet.
    // We use the indirection via Function() so TypeScript doesn't try to resolve
    // the "playwright" types at compile-time when the package isn't installed.
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<any>;
    return (await dynamicImport("playwright")) as PlaywrightModule;
  } catch {
    return null;
  }
}

interface ActiveLoginSession {
  connectionId: string;
  context: AnyBrowserContext;
  page: AnyPage;
  emitter: EventEmitter;
  status: "starting" | "qr" | "authenticated" | "error" | "closed";
  lastQr?: string; // data URL
  error?: string;
  startedAt: number;
}

interface PostOptions {
  text?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

/**
 * Long-lived Playwright driver for WhatsApp Web.
 *
 * Login flow: caller starts a session, we open WA Web, screenshot the QR canvas
 * every 3s and emit it. When the user scans, the QR disappears and we mark
 * the session authenticated; the persistent profile stores cookies on disk.
 *
 * Posting flow: open a fresh page reusing the persistent profile, drive
 * the Status composer DOM. Selectors are intentionally centralized below
 * because WhatsApp Web changes them every few months.
 */
@Injectable()
export class WhatsAppDriver implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppDriver.name);
  private readonly sessions = new Map<string, ActiveLoginSession>();

  private get profilesRoot(): string {
    return process.env.PLAYWRIGHT_PROFILES_DIR || path.resolve(process.cwd(), "playwright-profiles");
  }

  async profileDirFor(connectionId: string): Promise<string> {
    const dir = path.join(this.profilesRoot, `wa_${connectionId}`);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /** Returns the existing session if any, else starts a new headless login. */
  async startLogin(connectionId: string): Promise<ActiveLoginSession> {
    const existing = this.sessions.get(connectionId);
    if (existing && existing.status !== "closed" && existing.status !== "error") return existing;

    const pw = await loadPlaywright();
    if (!pw) {
      throw new Error(
        "Playwright is not installed on the server. Install it with `cd backend && npm i playwright && npx playwright install chromium` to enable WhatsApp connectivity.",
      );
    }

    const profileDir = await this.profileDirFor(connectionId);
    const context = await pw.chromium.launchPersistentContext(profileDir, {
      headless: true,
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    const emitter = new EventEmitter();

    const session: ActiveLoginSession = {
      connectionId,
      context,
      page,
      emitter,
      status: "starting",
      startedAt: Date.now(),
    };
    this.sessions.set(connectionId, session);

    (async () => {
      try {
        await page.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded", timeout: 60_000 });

        const deadline = Date.now() + 5 * 60_000;
        while (Date.now() < deadline) {
          // If the chat list pane is visible, login completed.
          const loggedIn = await page
            .$("div[data-testid='chat-list'], div#pane-side, [aria-label='Chat list']")
            .then((el: any) => !!el)
            .catch(() => false);
          if (loggedIn) {
            session.status = "authenticated";
            session.emitter.emit("authenticated");
            break;
          }
          // Otherwise, look for the QR canvas.
          const qrEl = await page.$("canvas[aria-label='Scan me!'], canvas[role='img'], div[data-testid='qrcode'] canvas");
          if (qrEl) {
            const buffer = await qrEl.screenshot({ type: "png" });
            const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
            session.lastQr = dataUrl;
            session.status = "qr";
            session.emitter.emit("qr", dataUrl);
          }
          await new Promise((r) => setTimeout(r, 3000));
        }

        if (session.status !== "authenticated") {
          session.status = "error";
          session.error = "Login timed out — QR code expired before scanning.";
          session.emitter.emit("error", session.error);
        }
      } catch (err: any) {
        this.logger.error(`WhatsApp login error: ${err?.message || err}`);
        session.status = "error";
        session.error = err?.message || String(err);
        session.emitter.emit("error", session.error);
      } finally {
        // We keep the persistent context open so next request reuses cookies.
        try {
          await page.close();
        } catch { /* noop */ }
        try {
          await context.close();
        } catch { /* noop */ }
      }
    })();

    return session;
  }

  getSession(connectionId: string) {
    return this.sessions.get(connectionId);
  }

  async cancelLogin(connectionId: string) {
    const sess = this.sessions.get(connectionId);
    if (!sess) return;
    sess.status = "closed";
    try {
      await sess.context.close();
    } catch { /* noop */ }
    this.sessions.delete(connectionId);
  }

  async postStatus(connectionId: string, opts: PostOptions): Promise<PublishResultLike> {
    const pw = await loadPlaywright();
    if (!pw) throw new Error("Playwright not installed");

    const profileDir = await this.profileDirFor(connectionId);
    const context = await pw.chromium.launchPersistentContext(profileDir, {
      headless: true,
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
      viewport: { width: 1280, height: 800 },
    });
    try {
      const page = await context.newPage();
      await page.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded", timeout: 60_000 });

      // Wait for chat-list (i.e. logged-in state).
      await page.waitForSelector("div[data-testid='chat-list'], div#pane-side, [aria-label='Chat list']", {
        timeout: 60_000,
      });

      // Click Status tab.
      const statusBtn = await page.$("button[aria-label='Status'], div[data-testid='menu-bar-status']");
      if (!statusBtn) {
        throw new Error("Could not locate Status tab — WhatsApp Web layout may have changed");
      }
      await statusBtn.click();

      // Click + (new status) — UI varies; try a few selectors.
      const plus = await page.$("div[aria-label='Add status'], div[role='button'][aria-label*='status']");
      if (plus) await plus.click();

      // Compose: text status if no media; otherwise upload via file input.
      if (opts.imageUrl || opts.videoUrl) {
        const url = opts.imageUrl || opts.videoUrl!;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const mediaPath = path.join(profileDir, `tmp-${Date.now()}${opts.imageUrl ? ".jpg" : ".mp4"}`);
        await fs.writeFile(mediaPath, buf);

        const fileInput = await page.$("input[type='file']");
        if (!fileInput) throw new Error("Could not find file input for status media");
        await fileInput.setInputFiles(mediaPath);

        if (opts.text) {
          const captionField = await page.$("div[contenteditable='true'][data-tab]");
          if (captionField) await captionField.type(opts.text);
        }

        const sendBtn = await page.waitForSelector(
          "div[aria-label='Send'], button[aria-label='Send'], span[data-icon='send']",
          { timeout: 30_000 },
        );
        await sendBtn.click();
        await fs.unlink(mediaPath).catch(() => undefined);
      } else if (opts.text) {
        const textBtn = await page.$("div[aria-label='Text status'], div[role='button'][aria-label*='text']");
        if (textBtn) await textBtn.click();
        const editor = await page.waitForSelector("div[contenteditable='true']", { timeout: 30_000 });
        await editor.type(opts.text);
        const sendBtn = await page.waitForSelector(
          "div[aria-label='Send'], button[aria-label='Send'], span[data-icon='send']",
          { timeout: 30_000 },
        );
        await sendBtn.click();
      } else {
        throw new Error("WhatsApp status requires text, image, or video");
      }

      // Brief wait for upload completion.
      await new Promise((r) => setTimeout(r, 5000));
      return { external_id: `wa-${Date.now()}` };
    } finally {
      try {
        await context.close();
      } catch { /* noop */ }
    }
  }

  async onModuleDestroy() {
    for (const sess of this.sessions.values()) {
      try {
        await sess.context.close();
      } catch { /* noop */ }
    }
    this.sessions.clear();
  }
}

interface PublishResultLike {
  external_id?: string;
  external_url?: string;
}
