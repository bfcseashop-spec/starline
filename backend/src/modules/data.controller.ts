import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DatabaseService } from "../services/database.service";

function parseOrder(orderBy?: string, asc?: string) {
  if (!orderBy) return undefined;
  const direction = asc === "false" ? "DESC" : "ASC";
  return `"${orderBy}" ${direction}`;
}

@Controller("api/db")
export class DataController {
  constructor(private readonly db: DatabaseService) {}

  @Get(":table")
  async select(
    @Param("table") table: string,
    @Query("orderBy") orderBy?: string,
    @Query("ascending") ascending?: string,
    @Query() rawQuery: Record<string, any> = {},
  ) {
    const filters: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawQuery)) {
      if (["orderBy", "ascending"].includes(k)) continue;
      filters[k] = v;
    }
    const rows = await this.db.select(table, filters, parseOrder(orderBy, ascending));
    return { data: rows, error: null };
  }

  @Post(":table")
  async insert(@Param("table") table: string, @Body() payload: Record<string, any>) {
    const row = await this.db.insert(table, payload);
    return { data: row, error: null };
  }

  @Patch(":table")
  async update(
    @Param("table") table: string,
    @Body() body: { payload: Record<string, any>; filters: Record<string, any> },
  ) {
    const rows = await this.db.update(table, body.payload || {}, body.filters || {});
    return { data: rows, error: null };
  }

  @Delete(":table")
  async remove(@Param("table") table: string, @Body() body: { filters: Record<string, any> }) {
    const rows = await this.db.remove(table, body.filters || {});
    return { data: rows, error: null };
  }
}
