import { Body, Controller, Headers, Post } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { DatabaseService } from "../services/database.service";
import { AuthService } from "../services/auth.service";

type CreateCustomerBody = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  address?: string;
  project_name?: string | null;
  location?: string | null;
  building_image_url?: string | null;
  total_amount?: number | null;
  down_payment?: number | null;
  paid_amount?: number | null;
  installment_amount?: number | null;
};

@Controller("api/functions")
export class FunctionsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
  ) {}

  private verifyAdmin(authorization: string | undefined): string | null {
    const token = (authorization ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;
    try {
      const payload = this.auth.verify(token) as { sub?: string };
      if (!payload.sub) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private async adminHasRole(userId: string): Promise<boolean> {
    const roles = (await this.db.select("user_roles", { user_id: userId })) as { role: string }[];
    return roles.some((r) => r.role === "admin");
  }

  @Post("create-customer")
  async createCustomer(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: CreateCustomerBody,
  ) {
    const adminCount = ((await this.db.select("user_roles", { role: "admin" })) as unknown[]).length;
    const isBootstrap = adminCount === 0;
    if (!isBootstrap) {
      const adminId = this.verifyAdmin(authorization);
      if (!adminId || !(await this.adminHasRole(adminId))) {
        return { data: null, error: "Unauthorized — admin login required." };
      }
    }

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return { data: null, error: "Email is required." };
    }
    if (!body.password || body.password.length < 6) {
      return { data: null, error: "Password must be at least 6 characters." };
    }

    const exists = await this.db.select("users", { email });
    if (exists.length) {
      return { data: null, error: "A customer with this email already exists." };
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(body.password, 10);
    await this.db.insert("users", { id, email, password_hash });

    const displayName = body.full_name?.trim() || email;
    await this.db.insert("profiles", {
      user_id: id,
      full_name: displayName,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
    });

    await this.db.insert("user_roles", { user_id: id, role: "customer" });

    const name = body.project_name?.trim() ?? "";
    const totalAmt = Number(body.total_amount) || 0;
    const down = Number(body.down_payment) || 0;
    const paidExtra = Number(body.paid_amount) || 0;
    const installment = Number(body.installment_amount) || 0;

    const loc = body.location?.trim() ?? "";
    const coverUrl = body.building_image_url?.trim() ?? "";

    const wantsProperty =
      name.length > 0 ||
      loc.length > 0 ||
      coverUrl.length > 0 ||
      totalAmt > 0 ||
      down > 0 ||
      paidExtra > 0 ||
      installment > 0;

    if (wantsProperty) {
      const projectTitle = name || "Property";
      let effectivePaid = down + paidExtra;
      if (totalAmt > 0) effectivePaid = Math.min(Math.max(0, effectivePaid), totalAmt);

      const projectRow = (await this.db.insert("customer_projects", {
        user_id: id,
        project_name: projectTitle,
        location: loc.length > 0 ? loc : null,
        building_image_url: coverUrl.length > 0 ? coverUrl : null,
        total_amount: totalAmt,
        paid_amount: effectivePaid,
        monthly_installment: installment,
        status: "in_progress",
      })) as { id?: string } | null;

      const projId = projectRow?.id;
      const today = new Date().toISOString().slice(0, 10);

      if (projId) {
        if (down > 0) {
          await this.db.insert("payments", {
            user_id: id,
            project_id: projId,
            amount: down,
            payment_date: today,
            payment_method: "cash",
            status: "completed",
            notes: "Down payment",
          });
        }
        if (paidExtra > 0) {
          await this.db.insert("payments", {
            user_id: id,
            project_id: projId,
            amount: paidExtra,
            payment_date: today,
            payment_method: "cash",
            status: "completed",
            notes: "Initial payment",
          });
        }
      }
    }

    return { data: { user_id: id }, error: null };
  }
}
