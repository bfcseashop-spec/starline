import { Controller, Delete, Get, Param, Post, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import fs from "node:fs";
import path from "node:path";

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

  @Get("public/:bucket/:filename")
  getFile(@Param("bucket") bucket: string, @Param("filename") filename: string, @Res() res: Response) {
    const finalPath = path.join(storageRoot, bucket, filename);
    return res.sendFile(finalPath);
  }

  @Delete(":bucket/:filename")
  remove(@Param("bucket") bucket: string, @Param("filename") filename: string) {
    const finalPath = path.join(storageRoot, bucket, filename);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    return { data: true, error: null };
  }
}
