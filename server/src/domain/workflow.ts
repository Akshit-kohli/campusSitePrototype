import { IncidentStatus, EventKind } from "campus-shield-shared";
import type { Incident, IncidentEvent } from "campus-shield-shared";
import { randomUUID } from "crypto";

/** Allowed forward transitions. */
const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  [IncidentStatus.REPORTED]: IncidentStatus.ACKNOWLEDGED,
  [IncidentStatus.ACKNOWLEDGED]: IncidentStatus.DISPATCHED,
  [IncidentStatus.DISPATCHED]: IncidentStatus.ON_SITE,
  [IncidentStatus.ON_SITE]: IncidentStatus.RESOLVED,
  [IncidentStatus.RESOLVED]: null,
};

/**
 * Advances an incident to newStatus. Throws if the transition is illegal.
 * Returns the updated incident and the event to append.
 */
export function transition(
  incident: Incident,
  newStatus: IncidentStatus,
  now: number,
  note = ""
): { incident: Incident; event: IncidentEvent } {
  if (NEXT_STATUS[incident.status] !== newStatus) {
    throw new Error(`Illegal transition ${incident.status} -> ${newStatus}`);
  }

  const updated: Incident = {
    ...incident,
    status: newStatus,
    resolvedAt: newStatus === IncidentStatus.RESOLVED ? now : incident.resolvedAt,
  };

  const event: IncidentEvent = {
    id: randomUUID(),
    incidentId: incident.id,
    kind: EventKind.STATUS_CHANGED,
    status: newStatus,
    at: now,
    note,
  };

  return { incident: updated, event };
}
