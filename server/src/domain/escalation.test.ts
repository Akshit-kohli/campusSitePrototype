import { describe, it, expect } from "vitest";
import { computeLevel, shouldEscalate } from "./escalation.js";
import { IncidentStatus, IncidentType, Priority } from "campus-shield-shared";
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
  createdAt: 0,
  resolvedAt: null,
};

describe("computeLevel", () => {
  it("level 0 before first timeout", () => {
    expect(computeLevel(30, 60)).toBe(0);
  });

  it("level 1 at exactly one timeout", () => {
    expect(computeLevel(60, 60)).toBe(1);
  });

  it("level 2 at two timeouts", () => {
    expect(computeLevel(120, 60)).toBe(2);
  });

  it("capped at 2", () => {
    expect(computeLevel(999, 60)).toBe(2);
  });
});

describe("shouldEscalate", () => {
  it("escalates when enough time has passed", () => {
    // 60s elapsed with 10s timeout => level 2, incident is at 0
    expect(shouldEscalate(BASE, 60_000, 10)).toBe(true);
  });

  it("does not escalate before timeout", () => {
    // 5s elapsed with 10s timeout => level 0, incident at 0
    expect(shouldEscalate(BASE, 5_000, 10)).toBe(false);
  });

  it("does not escalate when already at same level", () => {
    const level1 = { ...BASE, escalationLevel: 1 };
    // 15s elapsed / 10s = 1 => level 1 same as current
    expect(shouldEscalate(level1, 15_000, 10)).toBe(false);
  });

  it("does not escalate non-REPORTED incidents", () => {
    const acked = { ...BASE, status: IncidentStatus.ACKNOWLEDGED };
    expect(shouldEscalate(acked, 999_000, 10)).toBe(false);
  });
});
