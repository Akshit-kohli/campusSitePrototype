import type { Incident, Responder } from "campus-shield-shared";
import { IncidentType } from "campus-shield-shared";

/** Haversine distance in km. */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const PRIMARY_ROLE: Record<IncidentType, string> = {
  [IncidentType.MEDICAL]: "MEDICAL",
  [IncidentType.FIRE]: "FIRE",
  [IncidentType.THREAT]: "SECURITY",
  [IncidentType.ACCIDENT]: "MEDICAL",
};

const OFFER_SIZE: Record<number, number> = { 0: 1, 1: 3 };

/** Client-side offer set computation (mirrors server logic). */
export function computeOfferSet(responders: Responder[], incident: Incident): Responder[] {
  const role = PRIMARY_ROLE[incident.type];
  const level = incident.escalationLevel;
  const candidates = responders
    .filter(r => r.role === role && r.available)
    .sort((a, b) => {
      const dA = haversine(incident.lat, incident.lng, a.lat, a.lng);
      const dB = haversine(incident.lat, incident.lng, b.lat, b.lng);
      return dA !== dB ? dA - dB : a.id.localeCompare(b.id);
    });
  if (level >= 2) return candidates;
  return candidates.slice(0, OFFER_SIZE[Math.min(level, 1)] ?? 1);
}
