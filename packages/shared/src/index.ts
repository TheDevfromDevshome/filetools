import { randomBytes } from "node:crypto";
import { join, extname, basename } from "node:path";
import { mkdir, rm, writeFile, readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { ConvertOptions } from "@filetools/types";

export function generateId(): string {
  return randomBytes(16).toString("hex");
}

export function generateJobId(): string {
  return randomBytes(8).toString("hex");
}

export function sanitizeFilename(filename: string): string {
  const base = basename(filename);
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.substring(0, 200);
}

export function getJobDir(storagePath: string, jobId: string): string {
  return join(storagePath, "jobs", jobId);
}

export function getInputDir(storagePath: string, jobId: string): string {
  return join(getJobDir(storagePath, jobId), "input");
}

export function getOutputDir(storagePath: string, jobId: string): string {
  return join(getJobDir(storagePath, jobId), "output");
}

export function getWorkingDir(storagePath: string, jobId: string): string {
  return join(getJobDir(storagePath, jobId), "working");
}

export async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function ensureJobDirs(storagePath: string, jobId: string): Promise<void> {
  await ensureDir(getInputDir(storagePath, jobId));
  await ensureDir(getOutputDir(storagePath, jobId));
  await ensureDir(getWorkingDir(storagePath, jobId));
}

export async function cleanupJob(storagePath: string, jobId: string): Promise<void> {
  const jobDir = getJobDir(storagePath, jobId);
  if (existsSync(jobDir)) {
    await rm(jobDir, { recursive: true, force: true });
  }
}

export async function writeFileFromBuffer(
  dirPath: string,
  filename: string,
  data: Buffer
): Promise<string> {
  await ensureDir(dirPath);
  const safeName = sanitizeFilename(filename);
  const filePath = join(dirPath, safeName);
  await writeFile(filePath, data);
  return filePath;
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}

export async function getFilesInDir(dirPath: string): Promise<string[]> {
  if (!existsSync(dirPath)) return [];
  const entries = await readdir(dirPath);
  return entries.map((e) => join(dirPath, e));
}

export async function getFileSize(filePath: string): Promise<number> {
  const s = await stat(filePath);
  return s.size;
}

export function getExtension(filename: string): string {
  return extname(filename).toLowerCase().replace(".", "");
}

export function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    avif: "image/avif",
    heic: "image/heic",
    // PDF
    pdf: "application/pdf",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    aac: "audio/aac",
    opus: "audio/opus",
    wma: "audio/x-ms-wma",
    amr: "audio/amr",
    aiff: "audio/aiff",
    // Video
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m4v: "video/x-m4v",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    ts: "video/mp2t",
    mts: "video/mp2t",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
    // Archives
    zip: "application/zip",
    "7z": "application/x-7z-compressed",
    rar: "application/vnd.rar",
    tar: "application/x-tar",
    gz: "application/gzip",
    tgz: "application/gzip",
    bz2: "application/x-bzip2",
    xz: "application/x-xz",
    // Documents
    txt: "text/plain",
    json: "application/json",
    csv: "text/csv",
    html: "text/html",
    htm: "text/html",
    xml: "application/xml",
    md: "text/markdown",
    rtf: "application/rtf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    epub: "application/epub+zip",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

export { type ConvertOptions };
