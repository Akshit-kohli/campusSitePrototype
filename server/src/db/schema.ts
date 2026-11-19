import Database from "better-sqlite3";

/** Create all tables if they don't exist. */
export function runSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      isSos INTEGER NOT NULL DEFAULT 0,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      locationLabel TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      assignedResponderId TEXT,
      escalationLevel INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      resolvedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS responders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      available INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS incident_events (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT,
      at INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (incidentId) REFERENCES incidents(id)
    );
  `);
}
