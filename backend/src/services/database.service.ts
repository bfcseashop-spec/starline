import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";

const ALLOWED_TABLES = new Set([
  "users",
  "profiles",
  "user_roles",
  "customer_projects",
  "payments",
  "expenses",
  "documents",
  "work_updates",
  "project_images",
  "site_settings",
  "social_media_posts",
  "payment_methods",
  "investors",
  "investments",
  "investment_categories",
  "contributions",
  "investment_shares",
]);

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly tableColumns = new Map<string, Set<string>>();
  private readonly pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "starline",
  });

  async onModuleDestroy() {
    await this.pool.end();
  }

  assertTable(table: string) {
    if (!ALLOWED_TABLES.has(table)) throw new Error(`Table not allowed: ${table}`);
    return table;
  }

  query<T = any>(text: string, values: any[] = []) {
    return this.pool.query<T>(text, values);
  }

  private async getColumns(table: string) {
    const cached = this.tableColumns.get(table);
    if (cached) return cached;
    const { rows } = await this.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = $1`,
      [table],
    );
    const set = new Set<string>(rows.map((r) => String(r.column_name)));
    this.tableColumns.set(table, set);
    return set;
  }

  async select(table: string, filters: Record<string, any>, order?: string) {
    this.assertTable(table);
    const allowedCols = await this.getColumns(table);
    const params: any[] = [];
    const where: string[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(filters)) {
      if (val === undefined || val === null || val === "") continue;
      if (key.endsWith("__gte")) {
        const col = key.replace("__gte", "");
        if (!allowedCols.has(col)) continue;
        where.push(`"${col}" >= $${i++}`);
        params.push(val);
      } else if (key.endsWith("__lte")) {
        const col = key.replace("__lte", "");
        if (!allowedCols.has(col)) continue;
        where.push(`"${col}" <= $${i++}`);
        params.push(val);
      } else if (typeof val === "string" && val.includes(",")) {
        if (!allowedCols.has(key)) continue;
        const values = val.split(",").map((v) => v.trim()).filter(Boolean);
        const placeholders = values.map(() => `$${i++}`).join(", ");
        where.push(`"${key}" IN (${placeholders})`);
        params.push(...values);
      } else {
        if (!allowedCols.has(key)) continue;
        where.push(`"${key}" = $${i++}`);
        params.push(val);
      }
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderBy = order ? `ORDER BY ${order}` : "";
    const sql = `SELECT * FROM "${table}" ${whereClause} ${orderBy}`;
    const { rows } = await this.query(sql, params);
    return rows;
  }

  async insert(table: string, payload: Record<string, any>) {
    this.assertTable(table);
    const allowedCols = await this.getColumns(table);
    const keys = Object.keys(payload).filter((k) => allowedCols.has(k));
    if (!keys.length) return null;
    const cols = keys.map((k) => `"${k}"`).join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const values = keys.map((k) => payload[k]);
    const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.query(sql, values);
    return rows[0];
  }

  async update(table: string, payload: Record<string, any>, filters: Record<string, any>) {
    this.assertTable(table);
    const allowedCols = await this.getColumns(table);
    const setKeys = Object.keys(payload).filter((k) => allowedCols.has(k));
    const values: any[] = [];
    const setExpr = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    for (const k of setKeys) values.push(payload[k]);

    const where: string[] = [];
    let idx = setKeys.length + 1;
    for (const [k, v] of Object.entries(filters)) {
      if (!allowedCols.has(k)) continue;
      where.push(`"${k}" = $${idx++}`);
      values.push(v);
    }
    const sql = `UPDATE "${table}" SET ${setExpr} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} RETURNING *`;
    const { rows } = await this.query(sql, values);
    return rows;
  }

  async remove(table: string, filters: Record<string, any>) {
    this.assertTable(table);
    const allowedCols = await this.getColumns(table);
    const where: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(filters)) {
      if (!allowedCols.has(k)) continue;
      where.push(`"${k}" = $${i++}`);
      values.push(v);
    }
    const sql = `DELETE FROM "${table}" ${where.length ? `WHERE ${where.join(" AND ")}` : ""} RETURNING *`;
    const { rows } = await this.query(sql, values);
    return rows;
  }
}
