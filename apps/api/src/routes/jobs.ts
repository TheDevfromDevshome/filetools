import type { FastifyInstance } from "fastify";
import { db, schema } from "@filetools/database";
import { eq } from "drizzle-orm";
import { getConverter, getWorkerQueue } from "../lib/converter-registry.js";
import { getQueueForWorker } from "../lib/queue.js";
import { getInputDir, getOutputDir, ensureJobDirs, getExtension, sanitizeFilename } from "@filetools/shared";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const JOB_TTL = parseInt(process.env.JOB_TTL ?? "3600", 10);
const STORAGE_PATH = process.env.STORAGE_PATH ?? "./data";
const UPLOAD_DIR = path.join(STORAGE_PATH, "uploads");

export async function jobRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/jobs", async (request, reply) => {
    const body = request.body as {
      converterId: string;
      files: Array<{
        fileId: string;
        originalName: string;
        storedName: string;
        mimeType: string;
        size: number;
      }>;
      options?: Record<string, unknown>;
    };

    if (!body.converterId || !body.files?.length) {
      return reply.status(400).send({
        success: false,
        error: "converterId and files are required",
      });
    }

    const converterDef = getConverter(body.converterId);
    if (!converterDef) {
      return reply.status(404).send({
        success: false,
        error: "Converter not found",
      });
    }

    const workerQueue = getWorkerQueue(body.converterId);
    if (!workerQueue) {
      return reply.status(500).send({
        success: false,
        error: "No worker available for this converter",
      });
    }

    // Validate file formats
    for (const file of body.files) {
      const ext = getExtension(file.originalName);
      if (!converterDef.definition.inputFormats.includes(ext)) {
        return reply.status(400).send({
          success: false,
          error: `File ${file.originalName} has unsupported format .${ext}`,
        });
      }

      // Verify file exists on disk
      const diskPath = path.join(UPLOAD_DIR, file.storedName);
      if (!existsSync(diskPath)) {
        return reply.status(400).send({
          success: false,
          error: `File ${file.originalName} not found on disk`,
        });
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + JOB_TTL * 1000);

    // Create job in DB
    const [job] = await db
      .insert(schema.jobs)
      .values({
        converterId: body.converterId,
        options: body.options ?? {},
        status: "queued",
        expiresAt,
      })
      .returning();

    // Create file records in DB
    const fileRecords: Array<{ id: string; originalName: string; storedName: string; mimeType: string; size: number }> = [];
    for (const file of body.files) {
      const [dbFile] = await db
        .insert(schema.jobFiles)
        .values({
          jobId: job.id,
          originalName: sanitizeFilename(file.originalName),
          storedName: file.storedName,
          mimeType: file.mimeType,
          size: file.size,
          role: "input",
        })
        .returning();
      fileRecords.push({
        id: dbFile.id,
        originalName: dbFile.originalName,
        storedName: dbFile.storedName,
        mimeType: dbFile.mimeType,
        size: dbFile.size,
      });
    }

    // Move uploaded files to job input dir
    await ensureJobDirs(STORAGE_PATH, job.id);
    const inputDir = getInputDir(STORAGE_PATH, job.id);
    const { rename } = await import("node:fs/promises");

    const inputFilePaths: string[] = [];
    for (const file of fileRecords) {
      const srcPath = path.join(UPLOAD_DIR, file.storedName);
      const destPath = path.join(inputDir, file.storedName);
      try {
        await rename(srcPath, destPath);
      } catch {
        const data = await readFile(srcPath);
        const { writeFile } = await import("node:fs/promises");
        await writeFile(destPath, data);
        const { unlink } = await import("node:fs/promises");
        await unlink(srcPath).catch(() => {});
      }
      inputFilePaths.push(destPath);
    }

    // Enqueue job
    const queue = getQueueForWorker(workerQueue);
    await queue.add(
      "convert",
      {
        jobId: job.id,
        converterId: body.converterId,
        inputFiles: fileRecords.map((f) => ({
          id: f.id,
          storedName: f.storedName,
          originalName: f.originalName,
          path: path.join(inputDir, f.storedName),
        })),
        outputDir: getOutputDir(STORAGE_PATH, job.id),
        options: body.options ?? {},
      },
      {
        jobId: job.id,
        priority: 1,
      }
    );

    return reply.status(201).send({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        converterId: job.converterId,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
      },
    });
  });

  app.get("/api/v1/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1);

    if (!job) {
      return reply.status(404).send({ success: false, error: "Job not found" });
    }

    const files = await db
      .select()
      .from(schema.jobFiles)
      .where(eq(schema.jobFiles.jobId, id));

    return {
      success: true,
      data: {
        ...job,
        inputFiles: files.filter((f) => f.role === "input"),
        outputFiles: files.filter((f) => f.role === "output"),
      },
    };
  });

  app.get("/api/v1/jobs/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1);

    if (!job) {
      return reply.status(404).send({ success: false, error: "Job not found" });
    }

    return {
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    };
  });

  app.get("/api/v1/jobs/:id/download", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { mode?: string; fileId?: string };
    const mode = query.mode ?? "auto"; // auto | single | zip
    const fileId = query.fileId;
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1);

    if (!job) {
      return reply.status(404).send({ success: false, error: "Job not found" });
    }

    if (job.status !== "completed") {
      return reply.status(400).send({
        success: false,
        error: "Job is not completed yet",
      });
    }

    const outputFiles = await db
      .select()
      .from(schema.jobFiles)
      .where(eq(schema.jobFiles.jobId, id));

    const outputs = outputFiles.filter((f) => f.role === "output");

    if (outputs.length === 0) {
      return reply.status(404).send({ success: false, error: "No output files" });
    }

    const wantSingle = mode === "single";
    const wantZip = mode === "zip";
    const forceZip = wantZip || (!wantSingle && outputs.length > 1);

    const specificFile = fileId ? outputs.find((f) => f.id === fileId) : undefined;

    if (specificFile) {
      const file = specificFile;
      const filePath = path.join(getOutputDir(STORAGE_PATH, id), file.storedName);
      const { createReadStream } = await import("node:fs");
      const stream = createReadStream(filePath);
      return reply
        .header("Content-Type", file.mimeType)
        .header("Content-Disposition", `attachment; filename="${file.originalName}"`)
        .send(stream);
    }

    if (!forceZip) {
      const file = outputs[0];
      const filePath = path.join(getOutputDir(STORAGE_PATH, id), file.storedName);
      const { createReadStream } = await import("node:fs");
      const stream = createReadStream(filePath);
      return reply
        .header("Content-Type", file.mimeType)
        .header("Content-Disposition", `attachment; filename="${file.originalName}"`)
        .send(stream);
    }

    const archiver = await import("archiver");
    const { PassThrough } = await import("node:stream");
    const passThrough = new PassThrough();
    const archive = archiver.default("zip", { zlib: { level: 6 } });
    archive.pipe(passThrough);

    for (const file of outputs) {
      const filePath = path.join(getOutputDir(STORAGE_PATH, id), file.storedName);
      archive.file(filePath, { name: file.originalName });
    }

    archive.finalize();

    return reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", `attachment; filename="${job.id}-output.zip"`)
      .send(passThrough);
  });

  app.delete("/api/v1/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1);

    if (!job) {
      return reply.status(404).send({ success: false, error: "Job not found" });
    }

    await db.delete(schema.jobFiles).where(eq(schema.jobFiles.jobId, id));
    await db.delete(schema.jobs).where(eq(schema.jobs.id, id));

    const { cleanupJob } = await import("@filetools/shared");
    await cleanupJob(STORAGE_PATH, id);

    return { success: true };
  });
}
