import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import type { CampusConfig } from "campus-shield-shared";

const DATA_DIR = join(process.cwd(), "data");

/** Loads and returns campus config (buildings, safe points, instructions). */
function loadConfig(): CampusConfig {
  const campus = JSON.parse(readFileSync(join(DATA_DIR, "campus.json"), "utf-8")) as {
    buildings: CampusConfig["buildings"];
    safePoints: CampusConfig["safePoints"];
  };
  const instructions = JSON.parse(
    readFileSync(join(DATA_DIR, "instructions.json"), "utf-8")
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
