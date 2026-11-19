# CampusShield 🛡️

> Intelligent campus emergency coordinator: Report, locate, triage, assign, track, and close.

Campus emergencies (medical distress, fire hazards, threats, structural accidents) suffer from fragmented communication—panic calls to different guards, unclear victim coordinates, delayed responder dispatch, and zero audit trails. **CampusShield** solves this by providing a unified, real-time emergency dispatch platform with automated triage, nearest-responder offer sets, and rule-based SLA escalation.

---

## Features

- **🆘 Instant SOS & 1-Tap Categorization**: Dedicated giant SOS trigger for immediate critical dispatch, plus categorized buttons (Medical, Fire, Threat, Accident).
- **📍 Proximity-Snapping Geolocation**: Snaps device GPS coordinates to the nearest campus building with fallback interactive Leaflet map pin placement.
- **⚡ Automated Triage & Primary Role Routing**: Automatic priority assignment (Critical / High / Medium) and alert distribution to Security, Medical, or Fire personnel.
- **🎯 Dynamic Offer Sets**: Dispatches incidents to the nearest available responders using the Haversine formula, automatically locking assigned responders and releasing them upon closure.
- **⏱️ Rule-Based SLA Escalation**: If an incident is not acknowledged within the SLA timeout (default 60s, fast demo 10s), the offer set dynamically expands (Level 0 → 1 nearest; Level 1 → 3 nearest; Level 2 → all available + Admin red banner).
- **🔄 Live Two-Way Sync**: WebSocket hub (`/ws`) delivers sub-second status transitions across Reporter, Responder, and Admin dashboards without page reloads.
- **📊 Timeline & Performance Metrics**: Derives mean/median Time to Acknowledge (TTA) and Time to Dispatch (TTD) from append-only audit events.
- **🎮 Built-In Demo Simulator**: Repeatable demo controls (spawn incidents, fast escalation toggle, advance-all, database reset) powered by a seeded PRNG (`mulberry32`).

---

## UI Screenshots (Placeholders)

| Reporter (`/report`) | Responder (`/responder`) | Admin (`/admin`) |
|:---:|:---:|:---:|
| `[Screenshot Placeholder: Mobile SOS & Stepper]` | `[Screenshot Placeholder: Offer Set & Map]` | `[Screenshot Placeholder: Map, Timeline & Metrics]` |

---

## Quickstart (3 Commands)

Requires Node.js 20+ (tested on Node 20 & 26).

```bash
# 1. Install dependencies across all monorepo workspaces
npm install

# 2. Build shared types and client assets
npm run build

# 3. Start the production server (serves API, WebSocket, and client)
npm start
```

For concurrent hot-reloading development (Vite + TSX watch):
```bash
npm run dev
```

---

## The Three Application URLs

Once the server is running:

| View | Production URL | Vite Dev Proxy URL | Description |
|---|---|---|---|
| **Reporter** | `http://localhost:3001/report` | `http://localhost:5173/report` | Mobile-first SOS, building selection, live stepper & safe points |
| **Responder** | `http://localhost:3001/responder` | `http://localhost:5173/responder` | Responder identity picker, incident offer set, accept & status buttons |
| **Admin** | `http://localhost:3001/admin` | `http://localhost:5173/admin` | Live Leaflet map, SLA escalation banner, timeline, metrics & demo tools |

---

## Running Verification & Tests

```bash
# Typecheck all workspaces (strict TypeScript, zero any)
npm run typecheck

# Run domain, database, simulator, and route unit tests
npm test

# Run end-to-end integration smoke test (HTTP + WebSocket + Escalation + Metrics)
npx tsx scripts/smoke.ts
```

---

## Demo Walkthrough Steps

For an evaluator or presentation, follow this 3-minute sequence (full script in [`docs/DEMO.md`](docs/DEMO.md)):

1. Open `/report`, `/responder`, and `/admin` in three browser windows.
2. In `/admin`, toggle **"Fast Escalation (10s)"** to ON.
3. In `/report`, tap **"🏥 Medical"**, select **"Library Block"**, and submit.
4. Show the **Reporter** view displaying the nearest safe assembly point and first-aid instructions.
5. In `/responder`, select **Dr. Priya Sharma (MEDICAL)** and observe the incident in her offer set.
6. Click **"Accept"** -> the reporter's stepper updates in real-time to **ACKNOWLEDGED**.
7. Advance through **"Mark Dispatched"** -> **"Mark On-Site"** -> **"Resolve"**.
8. In `/admin`, click **"Spawn Demo Incident"**, let 10-20 seconds elapse, and observe the red **Level 2 CRITICAL ESCALATION** banner.
9. Review the generated **Mean Time to Acknowledge** metrics cards.

---

## Deployment Notes

- **Hosting**: Designed for deployment on containerized Node hosts like Render, Railway, Fly.io, or AWS App Runner.
  - Set Environment variable: `PORT` (defaults to `3001`).
  - Build command: `npm install && npm run build`
  - Start command: `npm start`
- **SQLite Database**: The local SQLite database file is stored at `server/campus_shield.db`. On ephemeral container hosts (free tiers of Render or Railway without persistent disk mounts), the SQLite file is ephemeral and re-seeds from `campus.json` and initial responders on boot.
- **Geolocation & HTTPS**: Browser `navigator.geolocation` strictly requires a secure origin (`https://` or `localhost`). When deployed to a public domain, ensure SSL/TLS is enabled so student mobile devices can acquire GPS fixes.
- **Runtime Trade-Off (`tsx`)**: The server runs via `tsx` in both dev and production to eliminate dual-build path alias synchronization overhead for rapid iteration.

---

## Honest Limitations & Future Scope

This is a functional hackathon prototype built to demonstrate real-time emergency orchestration. Before mission-critical production deployment:

1. **Authentication & RBAC**: Currently, responders select their identity from a dropdown for demonstration convenience. Production requires OAuth2/SSO with role-based access control and JWT token verification.
2. **Push Notifications & SMS**: Responders currently receive live push updates via active WebSocket. A production system must integrate Web Push API, SMS gateway (Twilio), and push alerts (APNs/FCM) for background alerts.
3. **Database Scalability**: SQLite is used for simplicity and zero setup. High-concurrency multi-campus installations should migrate repository queries to PostgreSQL (e.g. Supabase or RDS) with PostGIS for spatial indexing.
4. **Geographical Coordinates**: Campus coordinates currently simulate a university in Greater Noida Knowledge Park (~28.47°N, 77.49°E) marked approximate. Production requires surveying actual building entrances and OpenStreetMap polygon footprints.
5. **Multi-Campus Isolation**: Currently scoped to a single campus boundary. Future scope includes multi-tenant campus partition keys.

---

## Disclaimer

> **Prototype**: In a real emergency call **112** (or local emergency services).
