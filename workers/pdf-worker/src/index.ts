import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { pdfToImages, imagesToPdf } from "./converters/pdf-converter.js";
import {
  mergePdf,
  splitPdf,
  rotatePdf,
  compressPdf,
  protectPdf,
  unlockPdf,
  extractPagesPdf,
  addWatermarkPdf,
  pdfToText,
} from "./converters/pdf-tools.js";
import { ensureDir, getWorkingDir } from "@filetools/shared";
import { db, schema } from "@filetools/database";
import { eq } from "drizzle-orm";
import path from "node:path";
import { stat } from "node:fs/promises";
import pino from "pino";
import mime from "mime-types";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const concurrency = parseInt(process.env.WORKER_CONCURRENCY ?? "2", 10);

interface ConvertJobData {
  jobId: string;
  converterId: string;
  inputFiles: Array<{
    id: string;
    storedName: string;
    originalName: string;
    path: string;
  }>;
  outputDir: string;
  options: Record<string, unknown>;
}

function getOutputFormat(converterId: string): string {
  const map: Record<string, string> = {
    "pdf-to-jpg": "jpg",
    "pdf-to-png": "png",
    "jpg-to-pdf": "pdf",
    "png-to-pdf": "pdf",
    "webp-to-pdf": "pdf",
    "gif-to-pdf": "pdf",
    "tiff-to-pdf": "pdf",
    "pdf-to-txt": "txt",
  };
  return map[converterId] ?? "pdf";
}

function isPdfToImage(converterId: string): boolean {
  return converterId === "pdf-to-jpg" || converterId === "pdf-to-png";
}

function isImageToPdf(converterId: string): boolean {
  return converterId.endsWith("-to-pdf") && !isPdfToImage(converterId) && converterId !== "pdf-to-txt";
}

interface OutputRef {
  path: string;
  originalName: string;
  mimeType: string;
}

async function saveOutput(
  jobId: string,
  outputPath: string,
  originalName: string,
  mimeType: string
): Promise<void> {
  const fileSize = (await stat(outputPath)).size;
  await db.insert(schema.jobFiles).values({
    jobId,
    originalName,
    storedName: path.basename(outputPath),
    mimeType,
    size: fileSize,
    role: "output",
  });
}

async function processConvertJob(job: Job<ConvertJobData>): Promise<void> {
  const { jobId, converterId, inputFiles, outputDir, options } = job.data;

  logger.info({ jobId, converterId, fileCount: inputFiles.length }, "Starting PDF conversion");

  await db
    .update(schema.jobs)
    .set({ status: "processing", startedAt: new Date() })
    .where(eq(schema.jobs.id, jobId));

  await ensureDir(outputDir);

  const outputs: OutputRef[] = [];

  try {
    if (isPdfToImage(converterId)) {
      // PDF → Image(s)
      const format = getOutputFormat(converterId) as "jpg" | "png";

      for (const file of inputFiles) {
        await job.updateProgress(50);
        const outputPaths = await pdfToImages(file.path, outputDir, format, {
          quality: options.quality as number | undefined,
        });

        for (const outputPath of outputPaths) {
          const name = path.basename(outputPath);
          const lookup = mime.lookup(name);
          outputs.push({
            path: outputPath,
            originalName: name,
            mimeType: typeof lookup === "string" ? lookup : "application/octet-stream",
          });
        }
      }

      for (const out of outputs) {
        await saveOutput(jobId, out.path, out.originalName, out.mimeType);
      }
    } else if (isImageToPdf(converterId)) {
      // Image(s) → PDF
      const inputPaths = inputFiles.map((f) => f.path);
      const outputPath = path.join(outputDir, "output.pdf");
      await job.updateProgress(50);
      await imagesToPdf(inputPaths, outputPath);
      await saveOutput(jobId, outputPath, "output.pdf", "application/pdf");
    } else if (converterId === "pdf-to-txt") {
      // PDF → Text
      const inputPath = inputFiles[0].path;
      const base = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${base}.txt`);
      await job.updateProgress(50);
      await pdfToText(inputPath, outputPath);
      await saveOutput(jobId, outputPath, `${base}.txt`, "text/plain");
    } else if (converterId === "pdf-merge" || converterId === "pdf-combine") {
      // Merge multiple PDFs into one
      const outputPath = path.join(outputDir, "merged.pdf");
      await job.updateProgress(50);
      await mergePdf(
        inputFiles.map((f) => f.path),
        outputPath
      );
      await saveOutput(jobId, outputPath, "merged.pdf", "application/pdf");
    } else if (converterId === "pdf-split") {
      // Split a PDF into separate pages
      const inputPath = inputFiles[0].path;
      await job.updateProgress(40);
      const pageFiles = await splitPdf(inputPath, outputDir);
      for (let i = 0; i < pageFiles.length; i++) {
        const name = path.basename(pageFiles[i]);
        await saveOutput(jobId, pageFiles[i], name, "application/pdf");
        await job.updateProgress(40 + Math.round(((i + 1) / pageFiles.length) * 60));
      }
    } else if (converterId === "pdf-rotate") {
      const angle = (options.angle as number) ?? 90;
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "rotated.pdf");
      await job.updateProgress(50);
      await rotatePdf(inputPath, outputPath, angle);
      await saveOutput(jobId, outputPath, "rotated.pdf", "application/pdf");
    } else if (converterId === "pdf-compress") {
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "compressed.pdf");
      await job.updateProgress(50);
      await compressPdf(inputPath, outputPath);
      await saveOutput(jobId, outputPath, "compressed.pdf", "application/pdf");
    } else if (converterId === "pdf-protect") {
      const password = (options.password as string) ?? "";
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "protected.pdf");
      await job.updateProgress(50);
      await protectPdf(inputPath, outputPath, password);
      await saveOutput(jobId, outputPath, "protected.pdf", "application/pdf");
    } else if (converterId === "pdf-unlock") {
      const password = (options.password as string) || undefined;
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "unlocked.pdf");
      await job.updateProgress(50);
      await unlockPdf(inputPath, outputPath, password);
      await saveOutput(jobId, outputPath, "unlocked.pdf", "application/pdf");
    } else if (converterId === "pdf-extract") {
      const range = (options.range as string) ?? "1";
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "extracted.pdf");
      await job.updateProgress(50);
      await extractPagesPdf(inputPath, outputPath, range);
      await saveOutput(jobId, outputPath, "extracted.pdf", "application/pdf");
    } else if (converterId === "pdf-watermark") {
      const text = (options.text as string) ?? "CONFIDENTIAL";
      const inputPath = inputFiles[0].path;
      const outputPath = path.join(outputDir, "watermarked.pdf");
      await job.updateProgress(50);
      await addWatermarkPdf(inputPath, outputPath, text);
      await saveOutput(jobId, outputPath, "watermarked.pdf", "application/pdf");
    } else {
      throw new Error(`Unsupported converter: ${converterId}`);
    }

    await job.updateProgress(100);

    await db
      .update(schema.jobs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(schema.jobs.id, jobId));

    const duration = job.finishedOn ? (job.finishedOn - job.timestamp) / 1000 : 0;
    logger.info({ jobId, outputCount: outputs.length || 1, duration }, "Job completed");
  } catch (err) {
    logger.error({ jobId, err }, "Conversion failed");

    await db
      .update(schema.jobs)
      .set({
        status: "failed",
        error: (err as Error).message,
        completedAt: new Date(),
      })
      .where(eq(schema.jobs.id, jobId));

    throw err;
  }
}

const worker = new Worker<ConvertJobData>("pdf-convert", processConvertJob, {
  connection,
  concurrency,
  limiter: {
    max: 5,
    duration: 1000,
  },
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.data.jobId, err }, "Job failed");
});

worker.on("completed", (job) => {
  logger.info({ jobId: job.data.jobId }, "Job completed successfully");
});

worker.on("ready", () => {
  logger.info("PDF worker ready");
});

async function shutdown() {
  logger.info("PDF worker shutting down...");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

logger.info("PDF worker starting...");