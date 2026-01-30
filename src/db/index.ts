import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

export const db = SQLite.openDatabaseSync("gordon.db");

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  // Foreign keys are off by default in SQLite; enable them.
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await runMigrations(db);
}