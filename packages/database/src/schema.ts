import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: varchar("status", { length: 20 }).notNull().default("queued"),
    converterId: varchar("converter_id", { length: 100 }).notNull(),
    options: jsonb("options").$type<Record<string, unknown>>().default({}),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("jobs_status_idx").on(table.status),
    index("jobs_expires_at_idx").on(table.expiresAt),
    index("jobs_created_at_idx").on(table.createdAt),
  ]
);

export const jobFiles = pgTable(
  "job_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    originalName: varchar("original_name", { length: 500 }).notNull(),
    storedName: varchar("stored_name", { length: 200 }).notNull(),
    mimeType: varchar("mime_type", { length: 200 }).notNull(),
    size: integer("size").notNull(),
    role: varchar("role", { length: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("job_files_job_id_idx").on(table.jobId),
    index("job_files_role_idx").on(table.role),
  ]
);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 200 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobFile = typeof jobFiles.$inferSelect;
export type NewJobFile = typeof jobFiles.$inferInsert;
export type Setting = typeof settings.$inferSelect;
