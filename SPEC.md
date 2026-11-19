# CampusShield - Spec
Campus emergency coordinator: report, locate, triage, assign, track, close.

## Stack
Node 20+, Express, ws (WebSocket), better-sqlite3, zod, vitest. Client: Vite, React 18,
TypeScript, react-router-dom, Leaflet via react-leaflet (OpenStreetMap tiles).

## Domain
- IncidentType: MEDICAL, FIRE, THREAT, ACCIDENT. Priority: CRITICAL, HIGH, MEDIUM.
- Status: REPORTED -> ACKNOWLEDGED -> DISPATCHED -> ON_SITE -> RESOLVED (one step forward only)
- ResponderRole: SECURITY, MEDICAL, FIRE

## Triage
- FIRE and THREAT = CRITICAL, MEDICAL = HIGH, ACCIDENT = MEDIUM. SOS reports are always CRITICAL.
- Roles alerted (first is primary): MEDICAL [MEDICAL, SECURITY], FIRE [FIRE, SECURITY],
  THREAT [SECURITY], ACCIDENT [MEDICAL, SECURITY].

## Assignment
- Haversine distance. Responders have lat/lng and an `available` flag.
- Offer set = nearest available responders of the primary role. Size by escalation level:
  L0 = 1, L1 = 3, L2 = all of that role. Ties broken by id.
- A responder in the offer set can accept (REPORTED -> ACKNOWLEDGED): sets
  assigned_responder_id and available = false. RESOLVED sets available = true.

## Escalation
- Only while status is REPORTED. level = min(2, floor(elapsedSeconds / ackTimeoutSeconds)).
  Default 60s, fast demo mode 10s. A server interval ticks every 1s using the Clock.
- A level change appends an ESCALATED event and broadcasts. L2 shows an admin banner.

## Workflow
- transition(incident, newStatus, now, note) is the only way to change status: validate,
  return the updated incident plus the event to append. service.ts persists and broadcasts.
- Events are append-only.

## Metrics
- timeToAck = first ACKNOWLEDGED event - createdAt; timeToDispatch likewise for DISPATCHED.
- Summary: counts by status, mean and median of both. Derived from events only.

## Data model
- incidents(id, type, priority, status, isSos, lat, lng, locationLabel, note,
  assignedResponderId, escalationLevel, createdAt, resolvedAt)
- responders(id, name, role, lat, lng, available)
- incident_events(id, incidentId, kind, status, at, note)

## API
- GET /api/health, GET /api/incidents, GET /api/incidents/:id, GET /api/responders,
  GET /api/metrics, GET /api/config (instructions, buildings, safe points)
- POST /api/incidents {type, isSos, lat, lng, locationLabel, note}
- POST /api/incidents/:id/accept {responderId}
- POST /api/incidents/:id/advance {responderId}
- POST /api/demo/spawn, /api/demo/advance-all, /api/demo/fast {enabled}, /api/demo/reset
- WebSocket /ws pushes {type: "incident" | "responder" | "event", payload}. Clients merge,
  and refetch a full snapshot on reconnect.

## Screens
- /report: giant SOS button, 4 type buttons, location ("Use my location" via
  navigator.geolocation snapped to the nearest building label, with building select +
  draggable map pin as fallback), optional note. After submit: live status stepper,
  type-specific instructions, nearest safe point. Incident id kept in localStorage so a
  refresh keeps tracking.
- /responder: pick identity (stored in localStorage), list of incidents offered to them,
  map of the selected incident, one button for the next transition.
- /admin: Leaflet map (marker colour by priority), incident table, per-incident timeline,
  metrics cards, escalation banner, demo controls.

## Simulator
- spawn(type, building) goes through the normal reporting path; advanceAll moves open
  incidents one step via the workflow. Seeded RNG for repeatable demos.

## Non-goals
Auth, push notifications, multi-campus. Documented as future scope.
