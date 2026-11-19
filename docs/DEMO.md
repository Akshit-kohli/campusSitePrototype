# CampusShield — 3-Minute Demo Script

A guided, step-by-step walkthrough script for hackathon presentations and evaluator demonstrations.

---

### Setup Before You Start
1. Start the platform: `npm start` (or `npm run dev` for hot reloading).
2. Open three separate browser windows or tabs side by side:
   - **Student / Reporter**: `http://localhost:3001/report` (or `http://localhost:5173/report`)
   - **Responder**: `http://localhost:3001/responder` (or `http://localhost:5173/responder`)
   - **Command Center (Admin)**: `http://localhost:3001/admin` (or `http://localhost:5173/admin`)
3. On the **Admin** screen, click **"Reset DB"** to start from a clean slate.

---

### Act 1: The Incident (0:00 – 0:45)
**Narrative**: *"It's 9:00 PM at Central Library. A bookshelf structural collapse occurs on the second floor, trapping and injuring two students."*

1. Switch to the **Reporter** screen (`/report`).
2. Point out the zero-login, mobile-first emergency layout:
   - The giant red **🆘 SOS** button for immediate critical dispatch.
   - The four categorized type buttons.
3. Tap **🏥 Medical**.
4. Show the location card:
   - Select **Library Block** from the dropdown (or tap the pin on the map).
   - Enter optional note: *"Bookshelf collapsed on 2nd floor, student injured"*.
5. Click **"Report Incident"**.
6. **Show immediate feedback**:
   - The status stepper immediately highlights **REPORTED**.
   - The nearest safe assembly point appears: **"North Ground Assembly" (130m away)**.
   - Actionable first-aid guidance for medical emergencies is shown to calm the reporter.
   - Note that the incident ID is persisted in `localStorage` so refreshing the tab won't lose the live status.

---

### Act 2: Triage & Responder Dispatch (0:45 – 1:30)
**Narrative**: *"CampusShield immediately calculates the nearest medical responder using Haversine distance."*

1. Switch to the **Responder** screen (`/responder`).
2. In the "Logged in as:" dropdown, select **Dr. Priya Sharma (MEDICAL)**.
3. **Show**: The incident is automatically offered to Dr. Priya because she is the closest available medical responder.
4. Click **"Accept"**.
   - Notice the status immediately changes to **ACKNOWLEDGED**.
   - In the database, Dr. Priya's status transitions to `available = false` so she cannot be double-assigned.
5. Switch to the **Reporter** screen:
   - Notice the status stepper updated **in real time via WebSocket without page refresh** to **ACKNOWLEDGED**.
6. Back on the **Responder** screen, click **"Mark Dispatched"** -> then **"Mark On-Site"** as the responder arrives at the library.

---

### Act 3: Forced Escalation SLA Demo (1:30 – 2:15)
**Narrative**: *"What happens when an incident goes unacknowledged during a chaotic campus emergency?"*

1. Switch to the **Admin** screen (`/admin`).
2. Toggle **"Fast Escalation (10s)"** to ON.
   - Mention: *"In normal mode, escalation steps every 60s. For this demo, we set the SLA timeout to 10s."*
3. Click **"Spawn Demo Incident"**.
   - An incident appears at another building (e.g., Computer Center).
4. Watch the Admin screen for 10 seconds:
   - After 10s, it escalates to **Level 1** (expanding offer set to 3 nearest responders).
   - After another 10s, it escalates to **Level 2**.
   - **Show**: A bright red alert banner appears across the top:
     `🚨 CRITICAL ESCALATION: 1 incident(s) unacknowledged at Level 2! All available personnel alerted.`
5. Explain: *"The platform automatically widens the offer pool when campus responders are overwhelmed, guaranteeing that no emergency falls through the cracks."*

---

### Act 4: Resolution & Metrics (2:15 – 3:00)
**Narrative**: *"Closing the loop and auditing campus safety metrics."*

1. Switch to the **Responder** screen:
   - For the library medical incident, click **"Resolve"**.
   - The responder is automatically released back to `available = true`.
2. On the **Admin** screen, click **"Advance All Open"** to resolve remaining simulated incidents.
3. **Show the Metrics Cards**:
   - Total Resolved incidents count.
   - **Mean & Median Time to Acknowledge (TTA)** calculated purely from append-only event logs.
   - **Mean & Median Time to Dispatch (TTD)**.
4. Conclude:
   - *"CampusShield replaces fragmented phone trees with real-time geospatial dispatch, automated SLA escalation, and full auditable incident timelines."*
   - Point out the footer: *"Prototype. In a real emergency call 112."*
