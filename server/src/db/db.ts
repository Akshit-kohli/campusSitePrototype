import Database from "better-sqlite3";
import { runSchema } from "./schema.js";
import { seedIfEmpty } from "./seed.js";
import { mkdirSync } from "fs";
import { join } from "path";

const DB_DIR = join(process.cwd(), "data");
const DB_PATH = join(DB_DIR, "campus_shield.db");

let _db: Database.Database | null = null;

/** Returns the singleton Database instance, creating and seeding it on first call. */
export function getDb(): Database.Database {
  if (_db) return _db;
  mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  runSchema(_db);
  seedIfEmpty(_db);
  return _db;
}

/** Create an in-memory Database for tests. */
export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runSchema(db);
  seedIfEmpty(db);
  return db;
}
