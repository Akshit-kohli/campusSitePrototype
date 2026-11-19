import { IncidentStatus, EventKind } from "campus-shield-shared";
import type { Incident, IncidentEvent, MetricsSummary } from "campus-shield-shared";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Computes a MetricsSummary from all incidents and their events.
 */
export function computeMetrics(incidents: Incident[], events: IncidentEvent[]): MetricsSummary {
  const counts = Object.fromEntries(
    Object.values(IncidentStatus).map(s => [s, 0])
  ) as Record<IncidentStatus, number>;

  for (const inc of incidents) counts[inc.status]++;

  const eventsByIncident = new Map<string, IncidentEvent[]>();
  for (const ev of events) {
    const list = eventsByIncident.get(ev.incidentId) ?? [];
    list.push(ev);
    eventsByIncident.set(ev.incidentId, list);
  }

  const ackTimes: number[] = [];
  const dispatchTimes: number[] = [];

  for (const inc of incidents) {
    const evs = eventsByIncident.get(inc.id) ?? [];
    const ackEv = evs.find(e => e.kind === EventKind.STATUS_CHANGED && e.status === IncidentStatus.ACKNOWLEDGED);
    if (ackEv) ackTimes.push(ackEv.at - inc.createdAt);
    const dispEv = evs.find(e => e.kind === EventKind.STATUS_CHANGED && e.status === IncidentStatus.DISPATCHED);
    if (dispEv) dispatchTimes.push(dispEv.at - inc.createdAt);
  }

  return {
    counts,
    meanTimeToAck: mean(ackTimes),
    medianTimeToAck: median(ackTimes),
    meanTimeToDispatch: mean(dispatchTimes),
    medianTimeToDispatch: median(dispatchTimes),
  };
}
