import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { convertImage, getOutputExtension } from "./converters/image-converter.js";
import { ensureDir } from "@filetools/shared";
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

async function processConvertJob(job: Job<ConvertJobData>): Promise<void> {
  const { jobId, converterId, inputFiles, outputDir, options } = job.data;

  logger.info({ jobId, converterId, fileCount: inputFiles.length }, "Starting image conversion");

  await db
    .update(schema.jobs)
    .set({ status: "processing", startedAt: new Date() })
    .where(eq(schema.jobs.id, jobId));

  await ensureDir(outputDir);

  const outputFormat = getOutputExtension(converterId);

  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles[i];
    const progress = Math.round(((i + 1) / inputFiles.length) * 100);
    await job.updateProgress(progress);

    try {
      const outputPath = await convertImage(file.path, outputDir, outputFormat, {
        quality: options.quality as number | undefined,
        width: options.width as number | undefined,
        height: options.height as number | undefined,
        maintainAspectRatio: options.maintainAspectRatio as boolean | undefined,
      });

      const outputName = path.basename(outputPath);
      const mimeLookup = mime.lookup(outputName);
      const mimeType = typeof mimeLookup === "string" ? mimeLookup : "application/octet-stream";
      const fileSize = (await stat(outputPath)).size;

      await db.insert(schema.jobFiles).values({
        jobId,
        originalName: `${path.basename(file.originalName, path.extname(file.originalName))}.${outputFormat}`,
        storedName: outputName,
        mimeType,
        size: fileSize,
        role: "output",
      });

      logger.info({ jobId, file: file.originalName, output: outputName }, "File converted");
    } catch (err) {
      logger.error({ jobId, file: file.originalName, err }, "Conversion failed for file");

      await db
        .update(schema.jobs)
        .set({
          status: "failed",
          error: `Failed to convert ${file.originalName}: ${(err as Error).message}`,
          completedAt: new Date(),
        })
        .where(eq(schema.jobs.id, jobId));

      throw err;
    }
  }

  await db
    .update(schema.jobs)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(schema.jobs.id, jobId));

  const duration = job.finishedOn ? (job.finishedOn - job.timestamp) / 1000 : 0;
  logger.info({ jobId, outputCount: inputFiles.length, duration }, "Job completed");
}

const worker = new Worker<ConvertJobData>("image-convert", processConvertJob, {
  connection,
  concurrency,
  limiter: {
    max: 10,
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
  logger.info("Image worker ready");
});

async function shutdown() {
  logger.info("Image worker shutting down...");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

logger.info("Image worker starting...");
