import { Client } from "pg";
import bcrypt from "bcryptjs";
import { loadRepoEnv } from "./load-repo-env";

loadRepoEnv();

async function main() {
  const email = process.env.DEFAULT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@starlineb.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "Admin@2814";
  const fullName = process.env.DEFAULT_ADMIN_NAME || process.env.ADMIN_NAME || "Starline Admin";

  const client = new Client({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "starline",
  });
  await client.connect();

  const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
  let userId = existing.rows[0]?.id as string | undefined;
  const hash = await bcrypt.hash(password, 10);

  if (!userId) {
    const inserted = await client.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hash],
    );
    userId = inserted.rows[0].id;
  } else {
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
  }

  await client.query(
    "INSERT INTO profiles (user_id, full_name) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name",
    [userId, fullName],
  );
  await client.query(
    "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT (user_id, role) DO NOTHING",
    [userId],
  );
  await client.end();
  console.log(`Admin ready: ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
