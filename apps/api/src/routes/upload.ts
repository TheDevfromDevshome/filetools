import type { FastifyInstance } from "fastify";
import { ensureDir, getExtension, sanitizeFilename, mimeFromExt } from "@filetools/shared";
import path from "node:path";
import { createWriteStream, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "104857666", 10);
const STORAGE_PATH = process.env.STORAGE_PATH ?? "./data";
const UPLOAD_DIR = path.join(STORAGE_PATH, "uploads");

const ALLOWED_MIMES = new Set([
  // Images
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/bmp", "image/tiff", "image/svg+xml", "image/x-icon",
  "image/avif", "image/heic",
  // PDF
  "application/pdf",
  // Audio
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/flac",
  "audio/mp4", "audio/aac", "audio/opus", "audio/x-ms-wma",
  "audio/amr", "audio/aiff", "audio/x-aiff",
  // Video
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "video/x-matroska", "video/x-m4v", "video/x-ms-wmv", "video/x-flv",
  "video/mpeg", "video/mp2t", "video/3gpp", "video/ogg",
  // Archives
  "application/zip", "application/x-7z-compressed", "application/vnd.rar",
  "application/x-tar", "application/gzip", "application/x-bzip2", "application/x-xz",
  // Documents
  "text/plain", "text/csv", "text/html", "text/markdown",
  "application/json", "application/xml",
  "application/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/epub+zip",
  // Fallback
  "application/octet-stream",
]);

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/upload", async (request, reply) => {
    const parts = request.parts();

    await ensureDir(UPLOAD_DIR);

    const uploadedFiles: Array<{
      fileId: string;
      originalName: string;
      storedName: string;
      size: number;
      mimeType: string;
    }> = [];

    for await (const part of parts) {
      if (!part.type || part.type !== "file") continue;

      const filename = part.filename || "unknown";
      const ext = getExtension(filename);
      const storedName = `${randomBytes(16).toString("hex")}.${ext}`;

      let contentType = part.mimetype || "application/octet-stream";
      if (contentType === "application/octet-stream") {
        const ext = getExtension(filename);
        contentType = mimeFromExt(ext);
      }
      if (!ALLOWED_MIMES.has(contentType)) {
        return reply.status(400).send({
          success: false,
          error: `File type ${contentType} is not allowed`,
        });
      }

      const filePath = path.join(UPLOAD_DIR, storedName);
      const writeStream = createWriteStream(filePath);

      let totalBytes = 0;
      let tooLarge = false;

      await new Promise<void>((resolve, reject) => {
        part.file.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_FILE_SIZE) {
            tooLarge = true;
            writeStream.destroy();
            reject(new Error("File too large"));
          }
        });

        part.file.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        part.file.on("error", reject);
      }).catch((err) => {
        if (tooLarge) {
          const { unlinkSync } = require("node:fs") as typeof import("node:fs");
          try { unlinkSync(filePath); } catch {}
          throw err;
        }
        throw err;
      });

      const fileId = randomBytes(16).toString("hex");

      uploadedFiles.push({
        fileId,
        originalName: sanitizeFilename(filename),
        storedName,
        size: totalBytes,
        mimeType: contentType,
      });
    }

    if (uploadedFiles.length === 0) {
      return reply.status(400).send({ success: false, error: "No files uploaded" });
    }

    return reply.status(201).send({
      success: true,
      data: uploadedFiles,
    });
  });
}
