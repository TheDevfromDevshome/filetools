import type { FastifyInstance } from "fastify";
import { checkForUpdates, downloadUpdate, applyUpdate, readUpdateStatus } from "../services/updater.js";

export async function updateRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/update/status", async (request, reply) => {
    try {
      const status = await readUpdateStatus();
      return { success: true, data: status };
    } catch (err) {
      return reply.status(500).send({ success: false, error: String(err) });
    }
  });

  app.post("/api/v1/update/check", async (request, reply) => {
    try {
      const status = await checkForUpdates();
      return { success: true, data: status };
    } catch (err) {
      return reply.status(500).send({ success: false, error: String(err) });
    }
  });

  app.post("/api/v1/update/download", async (request, reply) => {
    try {
      const status = await downloadUpdate();
      if (!status.downloaded) {
        return reply.status(202).send({ success: false, message: "Update could not be downloaded", data: status });
      }
      return { success: true, data: status };
    } catch (err) {
      return reply.status(500).send({ success: false, error: String(err) });
    }
  });

  app.post("/api/v1/update/apply", async (request, reply) => {
    try {
      const result = await applyUpdate();
      if (!result.applied) {
        return reply.status(202).send({ success: false, ...result });
      }
      return { success: true, ...result };
    } catch (err) {
      return reply.status(500).send({ success: false, error: String(err) });
    }
  });
}