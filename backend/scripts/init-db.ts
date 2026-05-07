import * as fs from "node:fs";
import * as path from "node:path";
import { Client } from "pg";
import { loadRepoEnv } from "./load-repo-env";

loadRepoEnv();

async function main() {
  const client = new Client({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "starline",
  });
  await client.connect();
  const sql = fs.readFileSync(path.resolve(__dirname, "../sql/init.sql"), "utf8");
  await client.query(sql);
  await client.end();
  console.log("Database initialized.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
