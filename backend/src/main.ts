import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./modules/app.module";

function buildAllowedOrigins(): string[] {
  const defaults = [
    "https://starlineb.com",
    "https://www.starlineb.com",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];
  const extra = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const merged = [...defaults, ...extra];
  return [...new Set(merged)];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = buildAllowedOrigins();

  app.enableCors({
    // Never pass Error into the cors callback — that can omit CORS headers on preflight OPTIONS.
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    // Browsers vary in Access-Control-Request-Headers casing; cors matches case-insensitively.
    allowedHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "Accept", "Accept-Language"],
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));
  await app.listen(Number(process.env.API_PORT || 4000));
}

bootstrap().catch((err: unknown) => {
  console.error("Nest bootstrap failed:", err);
  process.exit(1);
});
