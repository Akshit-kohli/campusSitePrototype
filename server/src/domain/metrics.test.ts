import { describe, it, expect } from "vitest";
import { computeMetrics } from "./metrics.js";
import { IncidentStatus, IncidentType, Priority, EventKind } from "campus-shield-shared";
import type { Incident, IncidentEvent } from "campus-shield-shared";

const makeIncident = (id: string, status: IncidentStatus, createdAt = 0): Incident => ({
  id, type: IncidentType.MEDICAL, priority: Priority.HIGH, status,
  isSos: false, lat: 28.47, lng: 77.49, locationLabel: "L", note: "",
  assignedResponderId: null, escalationLevel: 0, createdAt, resolvedAt: null,
});

const makeEvent = (incidentId: string, status: IncidentStatus, at: number): IncidentEvent => ({
  id: `ev-${incidentId}-${status}`,
  incidentId,
  kind: EventKind.STATUS_CHANGED,
  status,
  at,
  note: "",
});

describe("computeMetrics", () => {
  it("counts by status", () => {
    const incidents = [
      makeIncident("i1", IncidentStatus.REPORTED),
      makeIncident("i2", IncidentStatus.ACKNOWLEDGED),
      makeIncident("i3", IncidentStatus.RESOLVED),
    ];
    const { counts } = computeMetrics(incidents, []);
    expect(counts[IncidentStatus.REPORTED]).toBe(1);
    expect(counts[IncidentStatus.ACKNOWLEDGED]).toBe(1);
    expect(counts[IncidentStatus.RESOLVED]).toBe(1);
  });

  it("computes timeToAck from events", () => {
    const inc = makeIncident("i1", IncidentStatus.ACKNOWLEDGED, 1000);
    const ev = makeEvent("i1", IncidentStatus.ACKNOWLEDGED, 4000); // 3s ack time
    const { meanTimeToAck, medianTimeToAck } = computeMetrics([inc], [ev]);
    expect(meanTimeToAck).toBe(3000);
    expect(medianTimeToAck).toBe(3000);
  });

  it("returns null when no events", () => {
    const inc = makeIncident("i1", IncidentStatus.REPORTED);
    const { meanTimeToAck } = computeMetrics([inc], []);
    expect(meanTimeToAck).toBeNull();
  });

  it("computes median correctly for even-length array", () => {
    const incidents = [
      makeIncident("i1", IncidentStatus.ACKNOWLEDGED, 0),
      makeIncident("i2", IncidentStatus.ACKNOWLEDGED, 0),
    ];
    const events = [
      makeEvent("i1", IncidentStatus.ACKNOWLEDGED, 2000),  // 2s
      makeEvent("i2", IncidentStatus.ACKNOWLEDGED, 4000),  // 4s
    ];
    const { medianTimeToAck } = computeMetrics(incidents, events);
    expect(medianTimeToAck).toBe(3000);
  });
});
