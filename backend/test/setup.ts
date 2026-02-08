import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default async function globalSetup() {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Integration tests require DATABASE_URL or DATABASE_URL_TEST (e.g. in .env)."
    );
  }
  process.env.DATABASE_URL = url;
  const migrationsFolder = resolve(__dirname, "../src/db/migrations");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("../src/db/client.js");
  try {
    await migrate(db, { migrationsFolder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/connect|ECONNREFUSED|timeout/i.test(msg)) {
      throw new Error(
        `Cannot connect to Postgres at ${url.replace(/:[^:@]+@/, ":****@")}. Is it running?`
      );
    }
    throw err;
  }
}
