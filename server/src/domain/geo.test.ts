import { describe, it, expect } from "vitest";
import { haversine, nearestBuilding, nearestSafePoint } from "./geo.js";
import type { Building, SafePoint } from "campus-shield-shared";

describe("haversine", () => {
  it("returns 0 for same point", () => {
    expect(haversine(28.47, 77.49, 28.47, 77.49)).toBe(0);
  });

  it("returns positive distance for different points", () => {
    const d = haversine(28.47, 77.49, 28.48, 77.50);
    expect(d).toBeGreaterThan(0);
  });

  it("is symmetric", () => {
    const d1 = haversine(28.47, 77.49, 28.48, 77.50);
    const d2 = haversine(28.48, 77.50, 28.47, 77.49);
    expect(Math.abs(d1 - d2)).toBeLessThan(1e-10);
  });
});

const BUILDINGS: Building[] = [
  { id: "b1", name: "Library", lat: 28.47, lng: 77.49 },
  { id: "b2", name: "Lab", lat: 28.48, lng: 77.50 },
];

const SAFE_POINTS: SafePoint[] = [
  { id: "sp1", name: "Gate", lat: 28.46, lng: 77.48 },
  { id: "sp2", name: "Field", lat: 28.49, lng: 77.51 },
];

describe("nearestBuilding", () => {
  it("returns closest building", () => {
    const result = nearestBuilding(28.47, 77.49, BUILDINGS);
    expect(result.id).toBe("b1");
  });

  it("throws when no buildings", () => {
    expect(() => nearestBuilding(28.47, 77.49, [])).toThrow();
  });
});

describe("nearestSafePoint", () => {
  it("returns closest safe point", () => {
    const result = nearestSafePoint(28.49, 77.51, SAFE_POINTS);
    expect(result.id).toBe("sp2");
  });

  it("throws when no safe points", () => {
    expect(() => nearestSafePoint(28.47, 77.49, [])).toThrow();
  });
});
