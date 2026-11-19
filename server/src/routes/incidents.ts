import { Router } from "express";
import { z } from "zod";
import { IncidentType } from "campus-shield-shared";
import type { Service } from "../services/service.js";

const createSchema = z.object({
  type: z.nativeEnum(IncidentType),
  isSos: z.boolean(),
  lat: z.number(),
  lng: z.number(),
  locationLabel: z.string().min(1),
  note: z.string().default(""),
});

const acceptSchema = z.object({ responderId: z.string().min(1) });
const advanceSchema = z.object({ responderId: z.string().min(1) });

/** Routes for /api/incidents */
export function incidentRouter(service: Service): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(service.getIncidents());
  });

  router.get("/:id", (req, res) => {
    const inc = service.getIncident(req.params.id);
    if (!inc) return res.status(404).json({ error: "Not found" });
    return res.json(inc);
  });

  router.post("/", (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const inc = service.createIncident(parsed.data);
      return res.status(201).json(inc);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  });

  router.post("/:id/accept", (req, res) => {
    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const inc = service.acceptIncident(req.params.id, parsed.data.responderId);
      return res.json(inc);
    } catch (e) {
      return res.status(400).json({ error: String(e) });
    }
  });

  router.post("/:id/advance", (req, res) => {
    const parsed = advanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const inc = service.advanceIncident(req.params.id, parsed.data.responderId);
      return res.json(inc);
    } catch (e) {
      return res.status(400).json({ error: String(e) });
    }
  });

  return router;
}
