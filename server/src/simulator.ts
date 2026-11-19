import { IncidentType } from "campus-shield-shared";
import type { Incident } from "campus-shield-shared";
import type { Service } from "./services/service.js";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

/** Mulberry32 seeded PRNG returning [0,1). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BuildingRecord { id: string; name: string; lat: number; lng: number; }

/** Resolve campus.json path safely across roots. */
function getCampusPath(): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(dir, "../data/campus.json"),
    join(process.cwd(), "data/campus.json"),
    join(process.cwd(), "server/data/campus.json"),
  ];
  return candidates.find(c => existsSync(c)) ?? candidates[0];
}

/** Repeatable demo incident generator. */
export class Simulator {
  private readonly rand: () => number;
  private readonly buildings: BuildingRecord[];
  private readonly types = Object.values(IncidentType);

  constructor(private readonly service: Service, seed = 42) {
    this.rand = mulberry32(seed);
    const campus = JSON.parse(readFileSync(getCampusPath(), "utf-8")) as {
      buildings: BuildingRecord[];
    };
    this.buildings = campus.buildings;
  }

  /** Spawn a new incident via the normal reporting path. */
  spawn(type?: IncidentType, buildingId?: string): Incident {
    const t = type ?? this.types[Math.floor(this.rand() * this.types.length)];
    const building = buildingId
      ? this.buildings.find(b => b.id === buildingId) ?? this.buildings[0]
      : this.buildings[Math.floor(this.rand() * this.buildings.length)];

    return this.service.createIncident({
      type: t,
      isSos: false,
      lat: building.lat,
      lng: building.lng,
      locationLabel: building.name,
      note: "Simulator-generated",
    });
  }

  /** Advance all open (non-RESOLVED) incidents one step. */
  advanceAll(): void {
    const incidents = this.service.getIncidents();
    for (const inc of incidents) {
      if (inc.status === "RESOLVED" || !inc.assignedResponderId) continue;
      try {
        this.service.advanceIncident(inc.id, inc.assignedResponderId);
      } catch {
        // skip incidents that cannot advance
      }
    }
  }
}
