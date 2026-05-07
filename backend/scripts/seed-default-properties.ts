import * as fs from "node:fs";
import * as path from "node:path";
import { Client } from "pg";
import { loadRepoEnv } from "./load-repo-env";

loadRepoEnv();

type PortfolioItem = {
  id: number;
  slug: string;
  images: string[];
  title: string;
  location: string;
  price: string;
  priceNum: number;
  beds: number;
  baths: number;
  sqft: string;
  tag: string;
  type: string;
  description: string;
  amenities: string[];
  yearBuilt: number;
  garage: number;
  lotSize: string;
};

function statusFromPortfolioType(portfolioType: string): string {
  const n = portfolioType.trim().toLowerCase();
  if (n.includes("hand")) return "completed";
  if (n.includes("upcoming")) return "planned";
  return "in_progress";
}

async function main() {
  const jsonPath = path.join(__dirname, "..", "..", "src", "data", "defaultPortfolio.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  const items = JSON.parse(raw) as PortfolioItem[];

  const client = new Client({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "starline",
  });
  await client.connect();

  const marketingPayload = JSON.stringify({ items });

  await client.query(
    `INSERT INTO site_settings (setting_key, setting_value)
     VALUES ('marketing_properties', $1::jsonb)
     ON CONFLICT (setting_key)
     DO UPDATE SET setting_value = EXCLUDED.setting_value`,
    [marketingPayload],
  );
  console.log(`site_settings.marketing_properties → ${items.length} catalog items`);

  for (const prop of items) {
    const projectName = prop.title;
    const status = statusFromPortfolioType(prop.type);
    const cover = prop.images?.[0] ?? null;

    let projectId: string;
    const existing = await client.query(
      `SELECT id FROM customer_projects WHERE project_name = $1 AND user_id IS NULL LIMIT 1`,
      [projectName],
    );

    if (existing.rows.length > 0) {
      projectId = existing.rows[0].id as string;
      await client.query(
        `UPDATE customer_projects SET location = $2, status = $3, building_image_url = $4 WHERE id = $1`,
        [projectId, prop.location || null, status, cover],
      );
    } else {
      const ins = await client.query(
        `INSERT INTO customer_projects (user_id, project_name, location, status, building_image_url, total_amount, paid_amount, monthly_installment)
         VALUES (NULL, $1, $2, $3, $4, 0, 0, 0) RETURNING id`,
        [projectName, prop.location || null, status, cover],
      );
      projectId = ins.rows[0].id as string;
    }

    const { rows: cnt } = await client.query(`SELECT COUNT(*)::int AS c FROM project_images WHERE project_id = $1`, [
      projectId,
    ]);
    const hasImages = (cnt[0] as { c: number }).c > 0;
    if (!hasImages && Array.isArray(prop.images) && prop.images.length > 0) {
      let order = 0;
      for (const url of prop.images) {
        await client.query(`INSERT INTO project_images (project_id, image_url, caption, sort_order) VALUES ($1, $2, NULL, $3)`, [
          projectId,
          url,
          order++,
        ]);
      }
      console.log(`  + images for ${projectName}`);
    }
  }

  console.log(`customer_projects seeded/updated (${items.length} public portfolio rows, user_id NULL)`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
