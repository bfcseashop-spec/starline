import { Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import * as fs from "node:fs";
import * as path from "node:path";

const storageRoot = path.resolve(process.cwd(), "uploads");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

@Controller("api/storage")
export class StorageController {
  @Post("upload/:bucket")
  @UseInterceptors(FileInterceptor("file"))
  upload(@Param("bucket") bucket: string, @Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const requested = String((req.body as { path?: string } | undefined)?.path || "");
    const cleaned = requested
      .replace(/\\/g, "/")
      .split("/")
      .map((seg) => seg.trim())
      .filter((seg) => seg && seg !== "." && seg !== "..")
      .join("/");
    const fallbackName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const relativePath = cleaned || fallbackName;
    ensureDir(path.join(storageRoot, bucket, path.dirname(relativePath)));
    const finalPath = path.join(storageRoot, bucket, relativePath);
    fs.writeFileSync(finalPath, file.buffer);
    return {
      data: {
        path: `${bucket}/${relativePath}`,
        publicUrl: `/api/storage/public/${bucket}/${relativePath}`,
      },
      error: null,
    };
  }

  @Get("public/:bucket/*filePath")
  getFile(@Param("bucket") bucket: string, @Req() req: Request, @Res() res: Response) {
    const raw = (req.params as Record<string, string | string[]>).filePath;
    const filename = Array.isArray(raw) ? raw.join("/") : String(raw || "");
    const finalPath = path.join(storageRoot, bucket, filename);
    return res.sendFile(finalPath);
  }

  @Delete(":bucket/*filePath")
  remove(@Param("bucket") bucket: string, @Req() req: Request) {
    const raw = (req.params as Record<string, string | string[]>).filePath;
    const filename = Array.isArray(raw) ? raw.join("/") : String(raw || "");
    const finalPath = path.join(storageRoot, bucket, filename);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    return { data: true, error: null };
  }
}
