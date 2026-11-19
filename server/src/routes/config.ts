import { Router } from "express";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { CampusConfig } from "campus-shield-shared";

/** Resolve data directory safely across different execution roots. */
function getDataDir(): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(dir, "../../data"),
    join(process.cwd(), "data"),
    join(process.cwd(), "server/data"),
  ];
  return candidates.find(c => existsSync(join(c, "campus.json"))) ?? candidates[0];
}

/** Loads and returns campus config (buildings, safe points, instructions). */
function loadConfig(): CampusConfig {
  const dataDir = getDataDir();
  const campus = JSON.parse(readFileSync(join(dataDir, "campus.json"), "utf-8")) as {
    buildings: CampusConfig["buildings"];
    safePoints: CampusConfig["safePoints"];
  };
  const instructions = JSON.parse(
    readFileSync(join(dataDir, "instructions.json"), "utf-8")
  ) as CampusConfig["instructions"];
  return { buildings: campus.buildings, safePoints: campus.safePoints, instructions };
}

/** Routes for /api/config */
export function configRouter(): Router {
  const router = Router();
  const config = loadConfig();

  router.get("/", (_req, res) => {
    res.json(config);
  });

  return router;
}
