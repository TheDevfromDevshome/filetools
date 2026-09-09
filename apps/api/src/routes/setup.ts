import type { FastifyInstance } from "fastify";
import { getAllSettings, setSetting } from "../services/settings.js";
import { startMdns } from "../services/mdns.js";

const LANGUAGES = ["en", "de"];

export async function setupRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/setup/status", async () => {
    const s = await getAllSettings();
    return {
      success: true,
      data: {
        setupComplete: s.setupComplete === "true",
        language: s.language ?? "en",
        domainName: s.domainName ?? "filetools.local",
      },
    };
  });

  app.post("/api/v1/setup", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const language = String(body.language ?? "en");
    const domainName = String(body.domainName ?? "").trim();

    if (!LANGUAGES.includes(language)) {
      return reply.status(400).send({ success: false, error: "Language must be 'en' or 'de'" });
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(domainName)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid domain name — use letters, numbers, hyphens, and dots only",
      });
    }

    await setSetting("language", language);
    await setSetting("domainName", domainName);
    await setSetting("setupComplete", "true");

    startMdns().catch(() => {});

    const webPort = parseInt(process.env.WEB_PORT ?? "3000", 10);
    const baseUrl =
      webPort === 80
        ? `http://${domainName}`
        : `http://${domainName}:${webPort}`;

    return { success: true, data: { baseUrl } };
  });

  app.put("/api/v1/settings/language", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const language = String(body.language ?? "en");
    if (!LANGUAGES.includes(language)) {
      return reply.status(400).send({ success: false, error: "Language must be 'en' or 'de'" });
    }
    await setSetting("language", language);
    return { success: true };
  });
}
