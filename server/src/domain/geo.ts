import type { Building, SafePoint } from "campus-shield-shared";

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two lat/lng points in kilometres.
 */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Returns the building nearest to the given coordinates.
 */
export function nearestBuilding(lat: number, lng: number, buildings: Building[]): Building {
  if (buildings.length === 0) throw new Error("No buildings provided");
  return buildings.reduce((best, b) =>
    haversine(lat, lng, b.lat, b.lng) < haversine(lat, lng, best.lat, best.lng) ? b : best
  );
}

/**
 * Returns the safe point nearest to the given coordinates.
 */
export function nearestSafePoint(lat: number, lng: number, safePoints: SafePoint[]): SafePoint {
  if (safePoints.length === 0) throw new Error("No safe points provided");
  return safePoints.reduce((best, s) =>
    haversine(lat, lng, s.lat, s.lng) < haversine(lat, lng, best.lat, best.lng) ? s : best
  );
}
