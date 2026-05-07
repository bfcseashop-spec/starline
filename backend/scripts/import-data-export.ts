/**
 * Import table JSON dumps into PostgreSQL (e.g. from a prior CSV/JSON export).
 * Place files as `<DATA_EXPORT_DIR>/<table>.json` (array of row objects).
 * Env: DATA_EXPORT_DIR (default: `./data-export` next to cwd — use `backend/data-export` when you run via `npm run import:data`).
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const tables = [
  "profiles",
  "user_roles",
  "customer_projects",
  "project_images",
  "payments",
  "expenses",
  "documents",
  "work_updates",
  "site_settings",
  "social_media_posts",
  "payment_methods",
  "investors",
  "investment_categories",
  "investments",
  "contributions",
  "investment_shares",
];

async function main() {
  const sourceDir = process.env.DATA_EXPORT_DIR || path.resolve(process.cwd(), "data-export");
  const client = new Client({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "starline",
  });
  await client.connect();

  for (const table of tables) {
    const file = path.join(sourceDir, `${table}.json`);
    if (!fs.existsSync(file)) continue;
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const row of rows) {
      const keys = Object.keys(row);
      const cols = keys.map((k) => `"${k}"`).join(", ");
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map((k) => row[k]);
      await client.query(
        `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      );
    }
    console.log(`Imported ${table}: ${rows.length}`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
