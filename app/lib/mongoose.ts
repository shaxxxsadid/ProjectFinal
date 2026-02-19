import { db } from "./db";

// В dev Next.js пересоздаёт модули при hot reload,
// поэтому кэшируем соединение в глобальном объекте

const globalForDb = globalThis as unknown as {
  dbConnected: boolean | undefined;
};

export async function connectToDatabase() {
  if (globalForDb.dbConnected) return;
  await db.connect();   
  globalForDb.dbConnected = true;
}