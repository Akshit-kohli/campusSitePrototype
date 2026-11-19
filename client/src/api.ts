import {
  Incident, Responder, IncidentEvent, MetricsSummary, CampusConfig,
  CreateIncidentPayload, IncidentType, IncidentStatus,
} from "campus-shield-shared";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all incidents. */
export async function fetchIncidents(): Promise<Incident[]> {
  return json(await fetch(`${BASE}/incidents`));
}

/** Fetch a single incident by id. */
export async function fetchIncident(id: string): Promise<Incident> {
  return json(await fetch(`${BASE}/incidents/${id}`));
}

/** Create a new incident. */
export async function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  return json(await fetch(`${BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

/** Accept an incident as a responder. */
export async function acceptIncident(incidentId: string, responderId: string): Promise<Incident> {
  return json(await fetch(`${BASE}/incidents/${incidentId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  }));
}

/** Advance an incident one step. */
export async function advanceIncident(incidentId: string, responderId: string): Promise<Incident> {
  return json(await fetch(`${BASE}/incidents/${incidentId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  }));
}

/** Fetch all responders. */
export async function fetchResponders(): Promise<Responder[]> {
  return json(await fetch(`${BASE}/responders`));
}

/** Fetch metrics summary. */
export async function fetchMetrics(): Promise<MetricsSummary> {
  return json(await fetch(`${BASE}/metrics`));
}

/** Fetch campus config (buildings, safePoints, instructions). */
export async function fetchConfig(): Promise<CampusConfig> {
  return json(await fetch(`${BASE}/config`));
}

/** Spawn a demo incident. */
export async function demoSpawn(type?: IncidentType, buildingId?: string): Promise<Incident> {
  return json(await fetch(`${BASE}/demo/spawn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, buildingId }),
  }));
}

/** Advance all open incidents. */
export async function demoAdvanceAll(): Promise<void> {
  await fetch(`${BASE}/demo/advance-all`, { method: "POST" });
}

/** Set fast demo mode. */
export async function demoFast(enabled: boolean): Promise<void> {
  await fetch(`${BASE}/demo/fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

/** Reset demo data. */
export async function demoReset(): Promise<void> {
  await fetch(`${BASE}/demo/reset`, { method: "POST" });
}

export type { Incident, Responder, IncidentEvent, MetricsSummary, CampusConfig, IncidentType, IncidentStatus };
