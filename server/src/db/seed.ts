import Database from "better-sqlite3";
import { ResponderRole } from "campus-shield-shared";

const SEED_RESPONDERS = [
  { id: "r1", name: "Rajan Singh", role: ResponderRole.SECURITY, lat: 28.4722, lng: 77.4940 },
  { id: "r2", name: "Priya Nair", role: ResponderRole.SECURITY, lat: 28.4733, lng: 77.4958 },
  { id: "r3", name: "Dr. Anita Sharma", role: ResponderRole.MEDICAL, lat: 28.4716, lng: 77.4971 },
  { id: "r4", name: "Dr. Farhan Khan", role: ResponderRole.MEDICAL, lat: 28.4708, lng: 77.4932 },
  { id: "r5", name: "Suresh Verma", role: ResponderRole.FIRE, lat: 28.4729, lng: 77.4923 },
  { id: "r6", name: "Meena Joshi", role: ResponderRole.FIRE, lat: 28.4742, lng: 77.4913 },
];

/** Seed responders if the responders table is empty. */
export function seedIfEmpty(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM responders").get() as { c: number }).c;
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO responders (id, name, role, lat, lng, available) VALUES (?, ?, ?, ?, ?, 1)"
  );

  const insertAll = db.transaction(() => {
    for (const r of SEED_RESPONDERS) {
      insert.run(r.id, r.name, r.role, r.lat, r.lng);
    }
  });

  insertAll();
}
