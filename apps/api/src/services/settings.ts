import { db, schema } from "@filetools/database";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  const out: Record<string, string> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
}

export async function isSetupComplete(): Promise<boolean> {
  return (await getSetting("setupComplete")) === "true";
}
