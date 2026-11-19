import WebSocket from "ws";
import type { Incident, Responder, MetricsSummary, WsMessage } from "campus-shield-shared";

const PORT = process.env.PORT ?? "3001";
const BASE_HTTP = `http://localhost:${PORT}`;
const BASE_WS = `ws://localhost:${PORT}/ws`;

/** Helper to make typed HTTP requests. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_HTTP}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Sets up WebSocket and collects incoming messages. */
function setupWsClient(): { ws: WebSocket; messages: WsMessage[] } {
  const ws = new WebSocket(BASE_WS);
  const messages: WsMessage[] = [];
  ws.on("message", data => {
    try {
      messages.push(JSON.parse(data.toString()) as WsMessage);
    } catch {
      // ignore non-json
    }
  });
  return { ws, messages };
}

/** Accepts and advances an incident until RESOLVED. */
async function advanceToResolved(incidentId: string, responderId: string): Promise<void> {
  // Accept: REPORTED -> ACKNOWLEDGED
  await request(`/api/incidents/${incidentId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  });
  // DISPATCHED
  await request(`/api/incidents/${incidentId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  });
  // ON_SITE
  await request(`/api/incidents/${incidentId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  });
  // RESOLVED
  await request(`/api/incidents/${incidentId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responderId }),
  });
}

/** Main smoke test runner. */
export async function runSmoke(): Promise<void> {
  console.log("Starting smoke test against", BASE_HTTP);

  // 1. Check health
  const health = await request<{ ok: boolean }>("/api/health");
  if (!health.ok) throw new Error("Health check returned !ok");
  console.log("✓ Health check ok");

  // 2. Setup WebSocket
  const { ws, messages } = setupWsClient();
  await new Promise<void>((resolve, reject) => {
    ws.on("open", () => resolve());
    ws.on("error", reject);
  });
  console.log("✓ WebSocket connected");

  // 3. Reset demo and enable fast mode (10s ack timeout)
  await request("/api/demo/reset", { method: "POST" });
  await request("/api/demo/fast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  });
  console.log("✓ Reset and fast mode enabled (10s timeout)");

  // 4. Create incident
  const created = await request<Incident>("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "MEDICAL",
      isSos: false,
      lat: 28.4723,
      lng: 77.4939,
      locationLabel: "Library Block",
      note: "Smoke test incident",
    }),
  });
  if (created.status !== "REPORTED" || created.escalationLevel !== 0) {
    throw new Error(`Unexpected initial incident state: ${JSON.stringify(created)}`);
  }
  console.log("✓ Incident created:", created.id);

  // 5. Wait for fast escalation (ticks every 1s, timeout 10s)
  console.log("Waiting 11s for escalation level 1...");
  await sleep(11000);
  const escalated = await request<Incident>(`/api/incidents/${created.id}`);
  if (escalated.escalationLevel < 1) {
    throw new Error(`Expected escalationLevel >= 1, got ${escalated.escalationLevel}`);
  }
  console.log("✓ Escalation verified: Level", escalated.escalationLevel);

  // 6. Find medical responder to accept
  const responders = await request<Responder[]>("/api/responders");
  const medics = responders.filter(r => r.role === "MEDICAL" && r.available);
  if (medics.length === 0) throw new Error("No available medical responder");

  // 7. Accept and advance through all statuses
  await advanceToResolved(created.id, medics[0].id);
  const resolved = await request<Incident>(`/api/incidents/${created.id}`);
  if (resolved.status !== "RESOLVED") {
    throw new Error(`Expected RESOLVED status, got ${resolved.status}`);
  }
  console.log("✓ Advanced through workflow to RESOLVED");

  // 8. Check metrics
  const metrics = await request<MetricsSummary>("/api/metrics");
  if (metrics.counts.RESOLVED < 1) {
    throw new Error("Metrics did not record RESOLVED incident");
  }
  if (metrics.meanTimeToAck === null || metrics.meanTimeToAck < 0) {
    throw new Error("Invalid meanTimeToAck metrics");
  }
  console.log("✓ Metrics verified:", metrics);

  // 9. Verify WebSocket events received
  await sleep(500);
  ws.close();
  if (messages.length === 0) throw new Error("No WebSocket messages received");
  console.log(`✓ Received ${messages.length} WebSocket messages during session`);

  console.log("All smoke checks passed successfully!");
}

// Execute if run directly
runSmoke()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Smoke test failed:", err);
    process.exit(1);
  });
