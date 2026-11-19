import { randomUUID } from "crypto";
import {
  IncidentStatus, EventKind,
} from "campus-shield-shared";
import type { Incident, IncidentEvent, CreateIncidentPayload } from "campus-shield-shared";
import type { Repo } from "../db/repo.js";
import type { Clock } from "../db/repo.js";
import type { Hub } from "../ws/hub.js";
import { triagePriority } from "../domain/triage.js";
import { transition } from "../domain/workflow.js";
import { computeOfferSet } from "../domain/assignment.js";
import { shouldEscalate, buildEscalatedEvent, computeLevel } from "../domain/escalation.js";
import { computeMetrics } from "../domain/metrics.js";

/** Default ack timeout in seconds. */
const DEFAULT_ACK_TIMEOUT_S = 60;
const FAST_ACK_TIMEOUT_S = 10;

/** Orchestrates repo + domain + broadcast. */
export class Service {
  private fastMode = false;

  constructor(
    private readonly repo: Repo,
    private readonly hub: Hub,
    private readonly clock: Clock
  ) {}

  get ackTimeoutSeconds(): number {
    return this.fastMode ? FAST_ACK_TIMEOUT_S : DEFAULT_ACK_TIMEOUT_S;
  }

  /** Create and persist a new incident. Returns the created incident. */
  createIncident(payload: CreateIncidentPayload): Incident {
    const now = this.clock();
    const incident: Incident = {
      id: randomUUID(),
      type: payload.type,
      priority: triagePriority(payload.type, payload.isSos),
      status: IncidentStatus.REPORTED,
      isSos: payload.isSos,
      lat: payload.lat,
      lng: payload.lng,
      locationLabel: payload.locationLabel,
      note: payload.note,
      assignedResponderId: null,
      escalationLevel: 0,
      createdAt: now,
      resolvedAt: null,
    };
    this.repo.createIncident(incident);
    const event: IncidentEvent = {
      id: randomUUID(),
      incidentId: incident.id,
      kind: EventKind.CREATED,
      status: IncidentStatus.REPORTED,
      at: now,
      note: "",
    };
    this.repo.appendEvent(event);
    this.hub.broadcast({ type: "incident", payload: incident });
    return incident;
  }

  /** Accept an incident (REPORTED -> ACKNOWLEDGED). */
  acceptIncident(incidentId: string, responderId: string): Incident {
    const incident = this.repo.getIncident(incidentId);
    if (!incident) throw new Error("Incident not found");
    const responders = this.repo.getResponders();
    const offerSet = computeOfferSet(responders, incident, incident.escalationLevel);
    if (!offerSet.some(r => r.id === responderId)) {
      throw new Error("Responder not in offer set");
    }
    const { incident: updated, event } = transition(incident, IncidentStatus.ACKNOWLEDGED, this.clock());
    const withResponder = { ...updated, assignedResponderId: responderId };
    this.repo.updateIncident(withResponder);
    this.repo.appendEvent(event);
    const responder = responders.find(r => r.id === responderId)!;
    this.repo.updateResponder({ ...responder, available: false });
    this.hub.broadcast({ type: "incident", payload: withResponder });
    this.hub.broadcast({ type: "responder", payload: { ...responder, available: false } });
    return withResponder;
  }

  /** Advance an incident one step (ACKNOWLEDGED -> DISPATCHED -> ON_SITE -> RESOLVED). */
  advanceIncident(incidentId: string, responderId: string): Incident {
    const incident = this.repo.getIncident(incidentId);
    if (!incident) throw new Error("Incident not found");
    if (incident.assignedResponderId !== responderId) throw new Error("Unauthorized responder");
    const statusOrder = [
      IncidentStatus.REPORTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.DISPATCHED,
      IncidentStatus.ON_SITE, IncidentStatus.RESOLVED,
    ];
    const nextIdx = statusOrder.indexOf(incident.status) + 1;
    const nextStatus = statusOrder[nextIdx];
    const { incident: updated, event } = transition(incident, nextStatus, this.clock());
    this.repo.updateIncident(updated);
    this.repo.appendEvent(event);
    if (nextStatus === IncidentStatus.RESOLVED) {
      const responders = this.repo.getResponders();
      const responder = responders.find(r => r.id === responderId);
      if (responder) {
        this.repo.updateResponder({ ...responder, available: true });
        this.hub.broadcast({ type: "responder", payload: { ...responder, available: true } });
      }
    }
    this.hub.broadcast({ type: "incident", payload: updated });
    return updated;
  }

  /** Check all REPORTED incidents for escalation and apply if needed. */
  tickEscalation(): void {
    const now = this.clock();
    const incidents = this.repo.getIncidents();
    for (const inc of incidents) {
      if (!shouldEscalate(inc, now, this.ackTimeoutSeconds)) continue;
      const elapsed = (now - inc.createdAt) / 1000;
      const newLevel = computeLevel(elapsed, this.ackTimeoutSeconds);
      const updated = { ...inc, escalationLevel: newLevel };
      this.repo.updateIncident(updated);
      const ev = buildEscalatedEvent(inc, newLevel, now);
      this.repo.appendEvent(ev);
      this.hub.broadcast({ type: "incident", payload: updated });
      this.hub.broadcast({ type: "event", payload: ev });
    }
  }

  setFastMode(enabled: boolean): void { this.fastMode = enabled; }
  getIncidents() { return this.repo.getIncidents(); }
  getIncident(id: string) { return this.repo.getIncident(id); }
  getResponders() { return this.repo.getResponders(); }
  getEvents() { return this.repo.getEvents(); }

  getMetrics() {
    return computeMetrics(this.repo.getIncidents(), this.repo.getEvents());
  }

  resetDemo() { this.repo.resetDemo(); }
}
