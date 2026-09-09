import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export { schema };

const connectionString = process.env.DATABASE_URL ?? "postgresql://filetools:filetools@localhost:5432/filetools";

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
