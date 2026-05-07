import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { DatabaseService } from "./database.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(email: string, password: string, fullName?: string) {
    const exists = await this.db.select("users", { email });
    if (exists.length) throw new UnauthorizedException("Email already exists");
    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.db.insert("users", { email, password_hash });
    await this.db.insert("profiles", { user_id: user.id, full_name: fullName || email });
    await this.db.insert("user_roles", { user_id: user.id, role: "customer" });
    return this.issueSession(user.id, email);
  }

  async signIn(email: string, password: string) {
    const users = await this.db.select("users", { email });
    if (!users.length) throw new UnauthorizedException("Invalid credentials");
    const user = users[0] as any;
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueSession(user.id, email);
  }

  async issueSession(userId: string, email: string) {
    const roles = await this.db.select("user_roles", { user_id: userId });
    const token = await this.jwt.signAsync({ sub: userId, email, roles: roles.map((r: any) => r.role) });
    return {
      access_token: token,
      user: { id: userId, email },
      expires_in: 60 * 60 * 24 * 7,
      token_type: "bearer",
    };
  }

  verify(token: string) {
    return this.jwt.verify(token, { secret: process.env.JWT_SECRET || "starline-secret" });
  }
}
