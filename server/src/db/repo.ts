import Database from "better-sqlite3";
import {
  IncidentStatus, IncidentType, Priority, ResponderRole, EventKind
} from "campus-shield-shared";
import type { Incident, Responder, IncidentEvent } from "campus-shield-shared";

/** Clock abstraction for testability. */
export type Clock = () => number;

function rowToIncident(row: Record<string, unknown>): Incident {
  return {
    id: row.id as string,
    type: row.type as IncidentType,
    priority: row.priority as Priority,
    status: row.status as IncidentStatus,
    isSos: row.isSos === 1,
    lat: row.lat as number,
    lng: row.lng as number,
    locationLabel: row.locationLabel as string,
    note: row.note as string,
    assignedResponderId: (row.assignedResponderId as string | null) ?? null,
    escalationLevel: row.escalationLevel as number,
    createdAt: row.createdAt as number,
    resolvedAt: (row.resolvedAt as number | null) ?? null,
  };
}

function rowToResponder(row: Record<string, unknown>): Responder {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as ResponderRole,
    lat: row.lat as number,
    lng: row.lng as number,
    available: row.available === 1,
  };
}

function rowToEvent(row: Record<string, unknown>): IncidentEvent {
  return {
    id: row.id as string,
    incidentId: row.incidentId as string,
    kind: row.kind as EventKind,
    status: (row.status as IncidentStatus | null) ?? null,
    at: row.at as number,
    note: row.note as string,
  };
}

/** Repository: all SQL lives here, using prepared statements. */
export class Repo {
  private readonly getIncidentsStmt: Database.Statement;
  private readonly getIncidentStmt: Database.Statement;
  private readonly insertIncidentStmt: Database.Statement;
  private readonly updateIncidentStmt: Database.Statement;
  private readonly getRespondersStmt: Database.Statement;
  private readonly updateResponderStmt: Database.Statement;
  private readonly getEventsStmt: Database.Statement;
  private readonly getEventsByIncidentStmt: Database.Statement;
  private readonly appendEventStmt: Database.Statement;
  private readonly deleteIncidentsStmt: Database.Statement;
  private readonly resetRespondersStmt: Database.Statement;

  constructor(private readonly db: Database.Database) {
    this.getIncidentsStmt = db.prepare("SELECT * FROM incidents ORDER BY createdAt DESC");
    this.getIncidentStmt = db.prepare("SELECT * FROM incidents WHERE id = ?");
    this.insertIncidentStmt = db.prepare(
      `INSERT INTO incidents (id,type,priority,status,isSos,lat,lng,locationLabel,note,assignedResponderId,escalationLevel,createdAt,resolvedAt)
       VALUES (@id,@type,@priority,@status,@isSos,@lat,@lng,@locationLabel,@note,@assignedResponderId,@escalationLevel,@createdAt,@resolvedAt)`
    );
    this.updateIncidentStmt = db.prepare(
      `UPDATE incidents SET status=@status,assignedResponderId=@assignedResponderId,
       escalationLevel=@escalationLevel,resolvedAt=@resolvedAt WHERE id=@id`
    );
    this.getRespondersStmt = db.prepare("SELECT * FROM responders");
    this.updateResponderStmt = db.prepare(
      "UPDATE responders SET available=@available,lat=@lat,lng=@lng WHERE id=@id"
    );
    this.getEventsStmt = db.prepare("SELECT * FROM incident_events ORDER BY at ASC");
    this.getEventsByIncidentStmt = db.prepare(
      "SELECT * FROM incident_events WHERE incidentId=? ORDER BY at ASC"
    );
    this.appendEventStmt = db.prepare(
      "INSERT INTO incident_events (id,incidentId,kind,status,at,note) VALUES (@id,@incidentId,@kind,@status,@at,@note)"
    );
    this.deleteIncidentsStmt = db.prepare("DELETE FROM incidents");
    this.resetRespondersStmt = db.prepare("UPDATE responders SET available=1");
  }

  getIncidents(): Incident[] {
    return (this.getIncidentsStmt.all() as Record<string, unknown>[]).map(rowToIncident);
  }

  getIncident(id: string): Incident | null {
    const row = this.getIncidentStmt.get(id) as Record<string, unknown> | undefined;
    return row ? rowToIncident(row) : null;
  }

  createIncident(inc: Incident): void {
    this.insertIncidentStmt.run({
      ...inc,
      isSos: inc.isSos ? 1 : 0,
      assignedResponderId: inc.assignedResponderId ?? null,
      resolvedAt: inc.resolvedAt ?? null,
    });
  }

  updateIncident(inc: Incident): void {
    this.updateIncidentStmt.run({
      id: inc.id,
      status: inc.status,
      assignedResponderId: inc.assignedResponderId ?? null,
      escalationLevel: inc.escalationLevel,
      resolvedAt: inc.resolvedAt ?? null,
    });
  }

  getResponders(): Responder[] {
    return (this.getRespondersStmt.all() as Record<string, unknown>[]).map(rowToResponder);
  }

  updateResponder(r: Responder): void {
    this.updateResponderStmt.run({ id: r.id, available: r.available ? 1 : 0, lat: r.lat, lng: r.lng });
  }

  getEvents(): IncidentEvent[] {
    return (this.getEventsStmt.all() as Record<string, unknown>[]).map(rowToEvent);
  }

  getEventsByIncident(incidentId: string): IncidentEvent[] {
    return (this.getEventsByIncidentStmt.all(incidentId) as Record<string, unknown>[]).map(rowToEvent);
  }

  appendEvent(ev: IncidentEvent): void {
    this.appendEventStmt.run({ ...ev, status: ev.status ?? null });
  }

  resetDemo(): void {
    this.db.transaction(() => {
      this.db.prepare("DELETE FROM incident_events").run();
      this.deleteIncidentsStmt.run();
      this.resetRespondersStmt.run();
    })();
  }
}
