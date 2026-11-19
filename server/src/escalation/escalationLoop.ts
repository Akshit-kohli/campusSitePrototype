import { Service } from "../services/service.js";

/** Runs the escalation tick on a 1-second interval. */
export function startEscalationLoop(service: Service): NodeJS.Timeout {
  return setInterval(() => {
    service.tickEscalation();
  }, 1000);
}
