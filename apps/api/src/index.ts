import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { registerAllConverters } from "./lib/converter-definitions.js";
import { converterRoutes } from "./routes/converters.js";
import { jobRoutes } from "./routes/jobs.js";
import { uploadRoutes } from "./routes/upload.js";
import { adminRoutes } from "./routes/admin.js";
import { setupRoutes } from "./routes/setup.js";
import { cleanupExpiredJobs } from "./services/cleanup.js";
import { isSetupComplete, getSetting } from "./services/settings.js";
import { startMdns } from "./services/mdns.js";
import { db, schema } from "@filetools/database";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = parseInt(process.env.API_PORT ?? "3001", 10);
const CORS_ORIGIN_RAW = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const CORS_ORIGINS = CORS_ORIGIN_RAW.split(",").map((o) => o.trim());

async function isOriginAllowed(origin: string | undefined): Promise<boolean> {
  if (!origin) return true; // no origin = server-to-server
  if (CORS_ORIGINS.includes(origin)) return true;
  const domain = await getSetting("domainName");
  if (domain) {
    const webPort = parseInt(process.env.WEB_PORT ?? "3000", 10);
    const base = webPort === 80 ? `http://${domain}` : `http://${domain}:${webPort}`;
    if (origin === base) return true;
  }
  return false;
}

async function main() {
  registerAllConverters();

  const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");
  try {
    await migrate(db, { migrationsFolder });
  } catch (err) {
    console.error("Database migration failed:", err);
    process.exit(1);
  }

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(cors, {
    origin: async (origin: string | undefined) => isOriginAllowed(origin ?? undefined),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE ?? "104857666", 10),
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "FileTools API",
        description: "Self-hosted file converter platform",
        version: "1.0.0",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.get("/health", async () => {
    try {
      await db.execute(sql`SELECT 1`);
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch {
      return { status: "error", timestamp: new Date().toISOString() };
    }
  });

  await app.register(converterRoutes);
  await app.register(jobRoutes);
  await app.register(uploadRoutes);
  await app.register(adminRoutes);
  await app.register(setupRoutes);

  const cleanupInterval = setInterval(() => {
    cleanupExpiredJobs().catch((err) => {
      app.log.error({ err }, "Cleanup failed");
    });
  }, 60_000);

  const shutdown = async () => {
    clearInterval(cleanupInterval);
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`API server running on port ${PORT}`);

    if (await isSetupComplete()) {
      startMdns().catch(() => {});
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
