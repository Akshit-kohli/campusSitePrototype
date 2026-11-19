import type { Incident, Responder } from "campus-shield-shared";
import { haversine } from "./geo.js";
import { alertRoles } from "./triage.js";

/** Max offer set sizes per escalation level. */
const OFFER_SIZE: Record<number, number> = { 0: 1, 1: 3 };

/**
 * Computes the offer set: nearest available responders of the primary role
 * for the given escalation level (L0=1, L1=3, L2=all). Ties broken by id.
 */
export function computeOfferSet(
  responders: Responder[],
  incident: Incident,
  escalationLevel: number
): Responder[] {
  const primaryRole = alertRoles(incident.type)[0];
  const candidates = responders
    .filter(r => r.role === primaryRole && r.available)
    .sort((a, b) => {
      const distA = haversine(incident.lat, incident.lng, a.lat, a.lng);
      const distB = haversine(incident.lat, incident.lng, b.lat, b.lng);
      if (distA !== distB) return distA - distB;
      return a.id.localeCompare(b.id);
    });

  if (escalationLevel >= 2) return candidates;
  const size = OFFER_SIZE[Math.min(escalationLevel, 1)] ?? 1;
  return candidates.slice(0, size);
}
