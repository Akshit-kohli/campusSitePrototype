import { describe, it, expect } from "vitest";
import { transition } from "./workflow.js";
import { IncidentStatus, IncidentType, Priority, EventKind } from "campus-shield-shared";
import type { Incident } from "campus-shield-shared";

const BASE: Incident = {
  id: "i1",
  type: IncidentType.MEDICAL,
  priority: Priority.HIGH,
  status: IncidentStatus.REPORTED,
  isSos: false,
  lat: 28.47, lng: 77.49,
  locationLabel: "Library",
  note: "",
  assignedResponderId: null,
  escalationLevel: 0,
  createdAt: 1000,
  resolvedAt: null,
};

describe("transition", () => {
  it("advances REPORTED -> ACKNOWLEDGED", () => {
    const { incident, event } = transition(BASE, IncidentStatus.ACKNOWLEDGED, 2000);
    expect(incident.status).toBe(IncidentStatus.ACKNOWLEDGED);
    expect(event.kind).toBe(EventKind.STATUS_CHANGED);
    expect(event.status).toBe(IncidentStatus.ACKNOWLEDGED);
  });

  it("sets resolvedAt on RESOLVED", () => {
    const dispatched = { ...BASE, status: IncidentStatus.ON_SITE };
    const { incident } = transition(dispatched, IncidentStatus.RESOLVED, 5000);
    expect(incident.resolvedAt).toBe(5000);
  });

  it("throws on illegal transition (skip a step)", () => {
    expect(() => transition(BASE, IncidentStatus.DISPATCHED, 2000)).toThrow();
  });

  it("throws on backwards transition", () => {
    const acked = { ...BASE, status: IncidentStatus.ACKNOWLEDGED };
    expect(() => transition(acked, IncidentStatus.REPORTED, 2000)).toThrow();
  });

  it("throws on RESOLVED -> anything", () => {
    const resolved = { ...BASE, status: IncidentStatus.RESOLVED };
    expect(() => transition(resolved, IncidentStatus.REPORTED, 2000)).toThrow();
  });

  it("event carries optional note", () => {
    const { event } = transition(BASE, IncidentStatus.ACKNOWLEDGED, 2000, "unit on site");
    expect(event.note).toBe("unit on site");
  });
});
