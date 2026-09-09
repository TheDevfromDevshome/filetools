import { db, schema } from "@filetools/database";
import { eq, lt } from "drizzle-orm";
import { cleanupJob } from "@filetools/shared";

const STORAGE_PATH = process.env.STORAGE_PATH ?? "./data";

export async function cleanupExpiredJobs(): Promise<void> {
  const now = new Date();

  const expiredJobs = await db
    .select()
    .from(schema.jobs)
    .where(lt(schema.jobs.expiresAt, now));

  for (const job of expiredJobs) {
    await cleanupJob(STORAGE_PATH, job.id);
    await db.delete(schema.jobFiles).where(eq(schema.jobFiles.jobId, job.id));
    await db.delete(schema.jobs).where(eq(schema.jobs.id, job.id));
  }
}
