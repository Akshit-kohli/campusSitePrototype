/** Incident types supported by CampusShield. */
export enum IncidentType {
  MEDICAL = "MEDICAL",
  FIRE = "FIRE",
  THREAT = "THREAT",
  ACCIDENT = "ACCIDENT",
}

/** Incident priority levels. */
export enum Priority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
}

/** Incident lifecycle statuses (forward-only). */
export enum IncidentStatus {
  REPORTED = "REPORTED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  DISPATCHED = "DISPATCHED",
  ON_SITE = "ON_SITE",
  RESOLVED = "RESOLVED",
}

/** Responder role categories. */
export enum ResponderRole {
  SECURITY = "SECURITY",
  MEDICAL = "MEDICAL",
  FIRE = "FIRE",
}

/** Kinds of events appended to an incident timeline. */
export enum EventKind {
  CREATED = "CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  ESCALATED = "ESCALATED",
  NOTE = "NOTE",
}

/** An incident record. */
export interface Incident {
  id: string;
  type: IncidentType;
  priority: Priority;
  status: IncidentStatus;
  isSos: boolean;
  lat: number;
  lng: number;
  locationLabel: string;
  note: string;
  assignedResponderId: string | null;
  escalationLevel: number;
  createdAt: number;
  resolvedAt: number | null;
}

/** A responder record. */
export interface Responder {
  id: string;
  name: string;
  role: ResponderRole;
  lat: number;
  lng: number;
  available: boolean;
}

/** A single event in an incident's timeline. */
export interface IncidentEvent {
  id: string;
  incidentId: string;
  kind: EventKind;
  status: IncidentStatus | null;
  at: number;
  note: string;
}

/** Payload for creating an incident. */
export interface CreateIncidentPayload {
  type: IncidentType;
  isSos: boolean;
  lat: number;
  lng: number;
  locationLabel: string;
  note: string;
}

/** Metrics summary returned by /api/metrics. */
export interface MetricsSummary {
  counts: Record<IncidentStatus, number>;
  meanTimeToAck: number | null;
  medianTimeToAck: number | null;
  meanTimeToDispatch: number | null;
  medianTimeToDispatch: number | null;
}

/** WebSocket message pushed to clients. */
export interface WsMessage {
  type: "incident" | "responder" | "event";
  payload: Incident | Responder | IncidentEvent;
}

/** A building on campus. */
export interface Building {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** A safe assembly point. */
export interface SafePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** Config returned by /api/config. */
export interface CampusConfig {
  buildings: Building[];
  safePoints: SafePoint[];
  instructions: Record<IncidentType, string[]>;
}
