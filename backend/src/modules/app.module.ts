import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseService } from "../services/database.service";
import { AuthService } from "../services/auth.service";
import { AuthController } from "./auth.controller";
import { DataController } from "./data.controller";
import { StorageController } from "./storage.controller";
import { FunctionsController } from "./functions.controller";
import { SocialModule } from "./social/social.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "starline-secret",
      signOptions: { expiresIn: "7d" },
    }),
    SocialModule,
  ],
  controllers: [AuthController, DataController, StorageController, FunctionsController],
  providers: [DatabaseService, AuthService],
})
export class AppModule {}
