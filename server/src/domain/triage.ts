import { IncidentType, Priority, ResponderRole } from "campus-shield-shared";

/** Map from IncidentType to triage priority (before SOS override). */
const TYPE_PRIORITY: Record<IncidentType, Priority> = {
  [IncidentType.FIRE]: Priority.CRITICAL,
  [IncidentType.THREAT]: Priority.CRITICAL,
  [IncidentType.MEDICAL]: Priority.HIGH,
  [IncidentType.ACCIDENT]: Priority.MEDIUM,
};

/** Map from IncidentType to roles to alert (first = primary). */
const ALERT_ROLES: Record<IncidentType, ResponderRole[]> = {
  [IncidentType.MEDICAL]: [ResponderRole.MEDICAL, ResponderRole.SECURITY],
  [IncidentType.FIRE]: [ResponderRole.FIRE, ResponderRole.SECURITY],
  [IncidentType.THREAT]: [ResponderRole.SECURITY],
  [IncidentType.ACCIDENT]: [ResponderRole.MEDICAL, ResponderRole.SECURITY],
};

/**
 * Returns the triage priority. SOS always escalates to CRITICAL.
 */
export function triagePriority(type: IncidentType, isSos: boolean): Priority {
  if (isSos) return Priority.CRITICAL;
  return TYPE_PRIORITY[type];
}

/**
 * Returns the roles to alert for a given incident type (first is primary role).
 */
export function alertRoles(type: IncidentType): ResponderRole[] {
  return ALERT_ROLES[type];
}
