import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { getDb } from "./db/db.js";
import { Repo } from "./db/repo.js";
import { Hub } from "./ws/hub.js";
import { Service } from "./services/service.js";
import { Simulator } from "./simulator.js";
import { incidentRouter } from "./routes/incidents.js";
import { responderRouter } from "./routes/responders.js";
import { metricsRouter } from "./routes/metrics.js";
import { configRouter } from "./routes/config.js";
import { demoRouter } from "./routes/demo.js";

/** Creates and returns the Express app + HTTP server + WebSocketServer + Service. */
export function createApp(dbOverride?: ReturnType<typeof getDb>) {
  const db = dbOverride ?? getDb();
  const repo = new Repo(db);
  const hub = new Hub();
  const clock = () => Date.now();
  const service = new Service(repo, hub, clock);
  const simulator = new Simulator(service);

  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/incidents", incidentRouter(service));
  app.use("/api/responders", responderRouter(service));
  app.use("/api/metrics", metricsRouter(service));
  app.use("/api/config", configRouter());
  app.use("/api/demo", demoRouter(service, simulator));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  hub.register(wss);

  return { app, httpServer, service, wss };
}
