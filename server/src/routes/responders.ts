import { Router } from "express";
import type { Service } from "../services/service.js";

/** Routes for /api/responders */
export function responderRouter(service: Service): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(service.getResponders());
  });

  return router;
}
