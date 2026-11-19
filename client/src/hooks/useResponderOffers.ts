import { useMemo } from "react";
import type { Incident } from "campus-shield-shared";
import { IncidentStatus } from "campus-shield-shared";
import { computeOfferSet } from "./computeOfferSet.js";
import type { Responder } from "campus-shield-shared";

/**
 * Filters incidents offered to a given responder (they are in the offer set
 * and incident is still REPORTED).
 */
export function useResponderOffers(
  incidents: Incident[],
  responders: Responder[],
  responderId: string | null
): Incident[] {
  return useMemo(() => {
    if (!responderId) return [];
    return incidents.filter(inc => {
      if (inc.status !== IncidentStatus.REPORTED) return false;
      const offerSet = computeOfferSet(responders, inc);
      return offerSet.some(r => r.id === responderId);
    });
  }, [incidents, responders, responderId]);
}
