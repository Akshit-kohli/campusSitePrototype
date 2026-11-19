import { IncidentStatus, EventKind } from "campus-shield-shared";
import type { Incident, IncidentEvent } from "campus-shield-shared";
import { randomUUID } from "crypto";

/**
 * Computes escalation level from elapsed time and timeout.
 * level = min(2, floor(elapsedSeconds / ackTimeoutSeconds))
 */
export function computeLevel(elapsedSeconds: number, ackTimeoutSeconds: number): number {
  return Math.min(2, Math.floor(elapsedSeconds / ackTimeoutSeconds));
}

/**
 * Returns true if the incident should escalate to a higher level now.
 */
export function shouldEscalate(
  incident: Incident,
  now: number,
  ackTimeoutSeconds: number
): boolean {
  if (incident.status !== IncidentStatus.REPORTED) return false;
  const elapsedSeconds = (now - incident.createdAt) / 1000;
  const newLevel = computeLevel(elapsedSeconds, ackTimeoutSeconds);
  return newLevel > incident.escalationLevel;
}

/**
 * Builds an ESCALATED event for a level change.
 */
export function buildEscalatedEvent(incident: Incident, newLevel: number, now: number): IncidentEvent {
  return {
    id: randomUUID(),
    incidentId: incident.id,
    kind: EventKind.ESCALATED,
    status: null,
    at: now,
    note: `Escalated to level ${newLevel}`,
  };
}
