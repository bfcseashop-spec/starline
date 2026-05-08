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
  upload(@Param("bucket") bucket: string, @UploadedFile() file: Express.Multer.File) {
    ensureDir(path.join(storageRoot, bucket));
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const finalPath = path.join(storageRoot, bucket, filename);
    fs.writeFileSync(finalPath, file.buffer);
    return {
      data: {
        path: `${bucket}/${filename}`,
        publicUrl: `/api/storage/public/${bucket}/${filename}`,
      },
      error: null,
    };
  }

  @Get("public/:bucket/*")
  getFile(@Param("bucket") bucket: string, @Req() req: Request, @Res() res: Response) {
    const filename = String(req.params[0] || "");
    const finalPath = path.join(storageRoot, bucket, filename);
    return res.sendFile(finalPath);
  }

  @Delete(":bucket/*")
  remove(@Param("bucket") bucket: string, @Req() req: Request) {
    const filename = String(req.params[0] || "");
    const finalPath = path.join(storageRoot, bucket, filename);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    return { data: true, error: null };
  }
}
