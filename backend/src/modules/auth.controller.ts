import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { DatabaseService } from "../services/database.service";

@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
  ) {}

  @Post("signup")
  signUp(@Body() body: { email: string; password: string; full_name?: string }) {
    return this.auth.signUp(body.email, body.password, body.full_name);
  }

  @Post("signin")
  signIn(@Body() body: { email: string; password: string }) {
    return this.auth.signIn(body.email, body.password);
  }

  @Post("signout")
  signOut() {
    return { success: true };
  }

  @Get("session")
  async getSession(@Headers("authorization") authorization = "") {
    const token = authorization.replace("Bearer ", "");
    if (!token) return { session: null };
    const payload = this.auth.verify(token) as any;
    const roles = await this.db.select("user_roles", { user_id: payload.sub });
    return { session: { access_token: token, user: { id: payload.sub, email: payload.email }, roles } };
  }
}
