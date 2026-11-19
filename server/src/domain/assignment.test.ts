import { describe, it, expect } from "vitest";
import { computeOfferSet } from "./assignment.js";
import {
  IncidentType, IncidentStatus, Priority, ResponderRole,
} from "campus-shield-shared";
import type { Incident, Responder } from "campus-shield-shared";

const BASE_INCIDENT: Incident = {
  id: "i1",
  type: IncidentType.MEDICAL,
  priority: Priority.HIGH,
  status: IncidentStatus.REPORTED,
  isSos: false,
  lat: 28.47,
  lng: 77.49,
  locationLabel: "Library",
  note: "",
  assignedResponderId: null,
  escalationLevel: 0,
  createdAt: 1000,
  resolvedAt: null,
};

const makeResponder = (id: string, role: ResponderRole, lat: number, lng: number, available = true): Responder => ({
  id, name: id, role, lat, lng, available,
});

describe("computeOfferSet", () => {
  const medics: Responder[] = [
    makeResponder("r1", ResponderRole.MEDICAL, 28.47, 77.49),   // closest
    makeResponder("r2", ResponderRole.MEDICAL, 28.48, 77.50),
    makeResponder("r3", ResponderRole.MEDICAL, 28.49, 77.51),
    makeResponder("r4", ResponderRole.SECURITY, 28.47, 77.49),  // wrong role
  ];

  it("L0: returns 1 nearest of primary role", () => {
    const result = computeOfferSet(medics, BASE_INCIDENT, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("L1: returns up to 3 nearest", () => {
    const result = computeOfferSet(medics, BASE_INCIDENT, 1);
    expect(result).toHaveLength(3);
  });

  it("L2: returns all of primary role", () => {
    const result = computeOfferSet(medics, BASE_INCIDENT, 2);
    expect(result).toHaveLength(3); // r4 excluded (wrong role)
  });

  it("filters unavailable responders", () => {
    const busy = medics.map(r => ({ ...r, available: false }));
    const result = computeOfferSet(busy, BASE_INCIDENT, 2);
    expect(result).toHaveLength(0);
  });

  it("tie broken by id", () => {
    const tied: Responder[] = [
      makeResponder("r-b", ResponderRole.MEDICAL, 28.47, 77.49),
      makeResponder("r-a", ResponderRole.MEDICAL, 28.47, 77.49),
    ];
    const result = computeOfferSet(tied, BASE_INCIDENT, 0);
    expect(result[0].id).toBe("r-a");
  });

  it("role matching: FIRE incident uses FIRE role", () => {
    const fire = { ...BASE_INCIDENT, type: IncidentType.FIRE };
    const mixed: Responder[] = [
      makeResponder("f1", ResponderRole.FIRE, 28.47, 77.49),
      makeResponder("m1", ResponderRole.MEDICAL, 28.47, 77.49),
    ];
    const result = computeOfferSet(mixed, fire, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("f1");
  });
});
