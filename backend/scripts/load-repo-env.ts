/**
 * Standalone scripts don't get Nest's env loading. Load repo-root `.env` so PG* match production.
 * Tries: cwd/.env, cwd/../.env (when npm --prefix backend), and path relative to this file.
 */
import * as fs from "node:fs";
import * as path from "node:path";

function applyLine(line: string) {
  const t = line.trim();
  if (!t || t.startsWith("#")) return;
  const eq = t.indexOf("=");
  if (eq <= 0) return;
  const key = t.slice(0, eq).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
  let val = t.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).replace(/\\n/g, "\n");
  }
  if (process.env[key] === undefined) process.env[key] = val;
}

export function loadRepoEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(__dirname, "..", "..", ".env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split("\n")) applyLine(line);
    return;
  }
}
