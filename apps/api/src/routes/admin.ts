import type { FastifyInstance } from "fastify";
import { db, schema } from "@filetools/database";
import { eq, sql, count } from "drizzle-orm";
import { imageQueue, pdfQueue } from "../lib/queue.js";

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/admin/stats", async () => {
    const [jobCount] = await db.select({ value: count() }).from(schema.jobs);
    const [completedCount] = await db
      .select({ value: count() })
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "completed"));
    const [failedCount] = await db
      .select({ value: count() })
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "failed"));
    const [processingCount] = await db
      .select({ value: count() })
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "processing"));
    const [queuedCount] = await db
      .select({ value: count() })
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "queued"));

    const imageQueueCounts = await imageQueue.getJobCounts();
    const pdfQueueCounts = await pdfQueue.getJobCounts();

    return {
      success: true,
      data: {
        jobs: {
          total: jobCount.value,
          completed: completedCount.value,
          failed: failedCount.value,
          processing: processingCount.value,
          queued: queuedCount.value,
        },
        queues: {
          image: imageQueueCounts,
          pdf: pdfQueueCounts,
        },
      },
    };
  });

  app.get("/api/v1/admin/jobs", async (request) => {
    const query = request.query as { limit?: string; offset?: string; status?: string };
    const limit = parseInt(query.limit ?? "50", 10);
    const offset = parseInt(query.offset ?? "0", 10);

    let jobs;
    if (query.status) {
      jobs = await db
        .select()
        .from(schema.jobs)
        .where(eq(schema.jobs.status, query.status))
        .orderBy(sql`${schema.jobs.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
    } else {
      jobs = await db
        .select()
        .from(schema.jobs)
        .orderBy(sql`${schema.jobs.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
    }

    return { success: true, data: jobs };
  });

  app.get("/api/v1/admin/workers", async () => {
    const imageQueueCounts = await imageQueue.getJobCounts();
    const pdfQueueCounts = await pdfQueue.getJobCounts();

    return {
      success: true,
      data: [
        {
          name: "Image Worker",
          queue: "image-convert",
          status: "online",
          jobs: imageQueueCounts,
        },
        {
          name: "PDF Worker",
          queue: "pdf-convert",
          status: "online",
          jobs: pdfQueueCounts,
        },
      ],
    };
  });
}
