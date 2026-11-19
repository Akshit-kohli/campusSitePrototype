import { Router } from "express";
import { z } from "zod";
import { IncidentType } from "campus-shield-shared";
import type { Service } from "../services/service.js";
import type { Simulator } from "../simulator.js";

const spawnSchema = z.object({
  type: z.nativeEnum(IncidentType).optional(),
  buildingId: z.string().optional(),
});

const fastSchema = z.object({ enabled: z.boolean() });

/** Routes for /api/demo */
export function demoRouter(service: Service, simulator: Simulator): Router {
  const router = Router();

  router.post("/spawn", (req, res) => {
    const parsed = spawnSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const inc = simulator.spawn(parsed.data.type, parsed.data.buildingId);
      return res.status(201).json(inc);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  });

  router.post("/advance-all", (_req, res) => {
    simulator.advanceAll();
    res.json({ ok: true });
  });

  router.post("/fast", (req, res) => {
    const parsed = fastSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    service.setFastMode(parsed.data.enabled);
    res.json({ fastMode: parsed.data.enabled });
  });

  router.post("/reset", (_req, res) => {
    service.resetDemo();
    res.json({ ok: true });
  });

  return router;
}
