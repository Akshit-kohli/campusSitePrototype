import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createApp } from "../app.js";
import { createTestDb } from "../db/db.js";
import { IncidentType, IncidentStatus } from "campus-shield-shared";

type ServerInstance = ReturnType<typeof createApp>;

let server: ServerInstance;
let baseUrl: string;

beforeEach(async () => {
  const db = createTestDb();
  server = createApp(db);
  await new Promise<void>(resolve => server.httpServer.listen(0, resolve));
  const addr = server.httpServer.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
});

afterEach(async () => {
  await new Promise<void>(resolve => server.httpServer.close(() => resolve()));
});

async function post(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function get(path: string) {
  return fetch(`${baseUrl}${path}`);
}

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await get("/api/health");
    expect(res.status).toBe(200);
    const data = await res.json() as { ok: boolean };
    expect(data.ok).toBe(true);
  });
});

describe("GET /api/responders", () => {
  it("returns seeded responders", async () => {
    const res = await get("/api/responders");
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(6);
  });
});

describe("POST /api/incidents", () => {
  it("creates an incident", async () => {
    const res = await post("/api/incidents", {
      type: IncidentType.MEDICAL,
      isSos: false,
      lat: 28.47,
      lng: 77.49,
      locationLabel: "Library",
      note: "test",
    });
    expect(res.status).toBe(201);
    const inc = await res.json() as { status: string; id: string };
    expect(inc.status).toBe(IncidentStatus.REPORTED);
    expect(typeof inc.id).toBe("string");
  });

  it("rejects invalid body", async () => {
    const res = await post("/api/incidents", { bad: "data" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/incidents/:id/accept", () => {
  it("accepts with valid offer-set responder", async () => {
    // Create MEDICAL incident at same lat/lng as the first medical responder (r3: 28.4716, 77.4971)
    const createRes = await post("/api/incidents", {
      type: IncidentType.MEDICAL, isSos: false,
      lat: 28.4716, lng: 77.4971,
      locationLabel: "Medical Centre", note: "",
    });
    expect(createRes.status).toBe(201);
    const inc = await createRes.json() as { id: string };

    // Get all responders - the nearest medical one should be r3 (closest to 28.4716, 77.4971)
    const rRes = await get("/api/responders");
    const responders = await rRes.json() as Array<{ id: string; role: string; lat: number; lng: number }>;
    // Sort medical responders by distance and pick nearest
    const medics = responders
      .filter(r => r.role === "MEDICAL")
      .sort((a, b) => Math.hypot(a.lat - 28.4716, a.lng - 77.4971) - Math.hypot(b.lat - 28.4716, b.lng - 77.4971));
    const nearestMedic = medics[0];

    const res = await post(`/api/incidents/${inc.id}/accept`, { responderId: nearestMedic.id });
    expect(res.status).toBe(200);
    const updated = await res.json() as { status: string; assignedResponderId: string };
    expect(updated.status).toBe(IncidentStatus.ACKNOWLEDGED);
    expect(updated.assignedResponderId).toBe(nearestMedic.id);
  });
});

describe("GET /api/metrics", () => {
  it("returns metrics shape", async () => {
    const res = await get("/api/metrics");
    expect(res.status).toBe(200);
    const m = await res.json() as { counts: Record<string, number> };
    expect(typeof m.counts).toBe("object");
  });
});

describe("GET /api/config", () => {
  it("returns buildings and safePoints", async () => {
    const res = await get("/api/config");
    expect(res.status).toBe(200);
    const cfg = await res.json() as { buildings: unknown[]; safePoints: unknown[] };
    expect(Array.isArray(cfg.buildings)).toBe(true);
    expect(Array.isArray(cfg.safePoints)).toBe(true);
  });
});

describe("POST /api/demo/spawn", () => {
  it("spawns an incident", async () => {
    const res = await post("/api/demo/spawn", {});
    expect(res.status).toBe(201);
  });
});

describe("POST /api/demo/fast", () => {
  it("enables fast mode", async () => {
    const res = await post("/api/demo/fast", { enabled: true });
    expect(res.status).toBe(200);
    const data = await res.json() as { fastMode: boolean };
    expect(data.fastMode).toBe(true);
  });
});

describe("POST /api/demo/reset", () => {
  it("clears incidents after reset", async () => {
    const createRes = await post("/api/incidents", {
      type: IncidentType.FIRE, isSos: true, lat: 28.47, lng: 77.49,
      locationLabel: "Lab", note: "",
    });
    expect(createRes.status).toBe(201);

    const resetRes = await post("/api/demo/reset", {});
    expect(resetRes.status).toBe(200);

    const listRes = await get("/api/incidents");
    const data = await listRes.json() as unknown[];
    expect(data).toHaveLength(0);
  });
});
