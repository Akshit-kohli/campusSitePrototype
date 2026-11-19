import { Router } from "express";
import type { Service } from "../services/service.js";

/** Routes for /api/metrics */
export function metricsRouter(service: Service): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(service.getMetrics());
  });

  return router;
}
