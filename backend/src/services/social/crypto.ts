import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SOCIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || "starline-social-default-key";
  // Always derive a 32-byte key. Accept either a hex/base64 32-byte secret, or any string (hashed).
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  if (/^[A-Za-z0-9+/=]{44}$/.test(raw)) {
    try {
      const b = Buffer.from(raw, "base64");
      if (b.length === 32) return b;
    } catch { /* fall through */ }
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptJson(value: unknown): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: v1.<iv-b64>.<tag-b64>.<cipher-b64>
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptJson<T = any>(blob: string | null | undefined): T | null {
  if (!blob) return null;
  const parts = blob.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  try {
    const key = getKey();
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const enc = Buffer.from(parts[3], "base64");
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function maskCredentials<T extends Record<string, any>>(creds: T | null): Record<string, string> {
  if (!creds) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    if (v == null) continue;
    const s = String(v);
    if (s.length <= 6) out[k] = "•".repeat(s.length);
    else out[k] = `${s.slice(0, 3)}${"•".repeat(Math.max(3, s.length - 6))}${s.slice(-3)}`;
  }
  return out;
}
