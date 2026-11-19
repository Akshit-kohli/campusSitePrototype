import express from "express";
import { createApp } from "./app.js";
import { startEscalationLoop } from "./escalation/escalationLoop.js";
import { join } from "path";
import { existsSync } from "fs";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const { app, httpServer, service } = createApp();
const escalationTimer = startEscalationLoop(service);

const clientDist = join(process.cwd(), "..", "client", "dist");
if (existsSync(join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(join(clientDist, "index.html")));
}

httpServer.listen(PORT, () => {
  console.log(`CampusShield server on http://localhost:${PORT}`);
});

function shutdown() {
  clearInterval(escalationTimer);
  httpServer.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
