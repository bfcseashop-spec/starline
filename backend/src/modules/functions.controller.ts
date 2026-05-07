import { Body, Controller, Post } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { DatabaseService } from "../services/database.service";

@Controller("api/functions")
export class FunctionsController {
  constructor(private readonly db: DatabaseService) {}

  @Post("create-customer")
  async createCustomer(@Body() body: { email: string; password: string; full_name?: string }) {
    const exists = await this.db.select("users", { email: body.email });
    if (exists.length) {
      return { data: { user_id: exists[0].id }, error: null };
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(body.password || "ChangeMe123!", 10);
    await this.db.insert("users", { id, email: body.email, password_hash });
    await this.db.insert("profiles", { user_id: id, full_name: body.full_name || body.email });
    await this.db.insert("user_roles", { user_id: id, role: "customer" });
    return { data: { user_id: id }, error: null };
  }
}
