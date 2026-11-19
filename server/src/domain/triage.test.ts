import { describe, it, expect } from "vitest";
import { triagePriority, alertRoles } from "./triage.js";
import { IncidentType, Priority, ResponderRole } from "campus-shield-shared";

describe("triagePriority", () => {
  it("FIRE => CRITICAL", () => {
    expect(triagePriority(IncidentType.FIRE, false)).toBe(Priority.CRITICAL);
  });

  it("THREAT => CRITICAL", () => {
    expect(triagePriority(IncidentType.THREAT, false)).toBe(Priority.CRITICAL);
  });

  it("MEDICAL => HIGH", () => {
    expect(triagePriority(IncidentType.MEDICAL, false)).toBe(Priority.HIGH);
  });

  it("ACCIDENT => MEDIUM", () => {
    expect(triagePriority(IncidentType.ACCIDENT, false)).toBe(Priority.MEDIUM);
  });

  it("SOS always CRITICAL regardless of type", () => {
    expect(triagePriority(IncidentType.ACCIDENT, true)).toBe(Priority.CRITICAL);
    expect(triagePriority(IncidentType.MEDICAL, true)).toBe(Priority.CRITICAL);
  });
});

describe("alertRoles", () => {
  it("MEDICAL primary is MEDICAL", () => {
    expect(alertRoles(IncidentType.MEDICAL)[0]).toBe(ResponderRole.MEDICAL);
  });

  it("FIRE primary is FIRE", () => {
    expect(alertRoles(IncidentType.FIRE)[0]).toBe(ResponderRole.FIRE);
  });

  it("THREAT primary is SECURITY", () => {
    expect(alertRoles(IncidentType.THREAT)[0]).toBe(ResponderRole.SECURITY);
  });

  it("ACCIDENT primary is MEDICAL", () => {
    expect(alertRoles(IncidentType.ACCIDENT)[0]).toBe(ResponderRole.MEDICAL);
  });
});
