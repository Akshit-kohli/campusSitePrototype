import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import type Database from "better-sqlite3";

let db: Database.Database;

beforeEach(() => {
  db = createTestDb();
});

describe("schema", () => {
  it("creates incidents table", () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='incidents'").get();
    expect(row).toBeDefined();
  });

  it("creates responders table", () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='responders'").get();
    expect(row).toBeDefined();
  });

  it("creates incident_events table", () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_events'").get();
    expect(row).toBeDefined();
  });
});

describe("seed", () => {
  it("seeds 6 responders", () => {
    const count = (db.prepare("SELECT COUNT(*) as c FROM responders").get() as { c: number }).c;
    expect(count).toBe(6);
  });

  it("does not double-seed", () => {
    seedIfEmpty(db);
    const count = (db.prepare("SELECT COUNT(*) as c FROM responders").get() as { c: number }).c;
    expect(count).toBe(6);
  });

  it("all responders are available", () => {
    const rows = db.prepare("SELECT available FROM responders").all() as { available: number }[];
    expect(rows.every(r => r.available === 1)).toBe(true);
  });
});
