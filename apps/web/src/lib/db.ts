import { createDb } from "@whatsbet/database";

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.db) {
    globalForDb.db = createDb(process.env.DATABASE_URL);
  }
  return globalForDb.db;
}
