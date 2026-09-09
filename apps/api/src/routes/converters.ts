import type { FastifyInstance } from "fastify";
import { db, schema } from "@filetools/database";
import { eq } from "drizzle-orm";

export async function converterRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/converters", async () => {
    const { getAllConverters } = await import("../lib/converter-registry.js");
    const converters = getAllConverters();
    return { success: true, data: converters };
  });

  app.get("/api/v1/converters/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { getAllConverters } = await import("../lib/converter-registry.js");
    const converters = getAllConverters();
    const converter = converters.find((c) => c.id === id);
    if (!converter) {
      return reply.status(404).send({ success: false, error: "Converter not found" });
    }
    return { success: true, data: converter };
  });
}
