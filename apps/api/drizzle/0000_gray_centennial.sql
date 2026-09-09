CREATE TABLE IF NOT EXISTS "job_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"original_name" varchar(500) NOT NULL,
	"stored_name" varchar(200) NOT NULL,
	"mime_type" varchar(200) NOT NULL,
	"size" integer NOT NULL,
	"role" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"converter_id" varchar(100) NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" varchar(200) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "job_files" ADD CONSTRAINT "job_files_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_files_job_id_idx" ON "job_files" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_files_role_idx" ON "job_files" USING btree ("role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_expires_at_idx" ON "jobs" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_created_at_idx" ON "jobs" USING btree ("created_at");