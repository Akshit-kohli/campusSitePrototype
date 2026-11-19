import express from "express";
import { createApp } from "./app.js";
import { startEscalationLoop } from "./escalation/escalationLoop.js";
import { join, resolve, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const { app, httpServer, service } = createApp();
const escalationTimer = startEscalationLoop(service);

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(__dirname, "../../client/dist"),
  resolve(process.cwd(), "client/dist"),
  resolve(process.cwd(), "../client/dist"),
];
const clientDist = candidates.find(p => existsSync(join(p, "index.html")));

if (clientDist) {
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
