import { describe, it, expect, beforeEach } from "vitest";
import { Simulator } from "./simulator.js";
import { Service } from "./services/service.js";
import { Repo } from "./db/repo.js";
import { Hub } from "./ws/hub.js";
import { createTestDb } from "./db/db.js";
import { computeOfferSet } from "./domain/assignment.js";
import { IncidentType, IncidentStatus } from "campus-shield-shared";

describe("Simulator", () => {
  let service: Service;
  let now = 1_000_000;
  const clock = () => now;

  beforeEach(() => {
    const db = createTestDb();
    const repo = new Repo(db);
    const hub = new Hub();
    service = new Service(repo, hub, clock);
  });

  it("spawns incidents with seeded RNG determinism", () => {
    const sim1 = new Simulator(service, 12345);
    const inc1 = sim1.spawn();

    service.resetDemo();
    const sim2 = new Simulator(service, 12345);
    const inc2 = sim2.spawn();

    expect(inc1.type).toBe(inc2.type);
    expect(inc1.locationLabel).toBe(inc2.locationLabel);
  });

  it("spawns specific incident type and building when requested", () => {
    const sim = new Simulator(service);
    const inc = sim.spawn(IncidentType.FIRE, "b-lib");
    expect(inc.type).toBe(IncidentType.FIRE);
    expect(inc.locationLabel).toBe("Library Block");
  });

  it("advances assigned incidents forward", () => {
    const sim = new Simulator(service);
    const inc = sim.spawn(IncidentType.MEDICAL);
    const responders = service.getResponders();
    const offerSet = computeOfferSet(responders, inc, inc.escalationLevel);
    expect(offerSet.length).toBeGreaterThan(0);

    const nearestMedic = offerSet[0];
    service.acceptIncident(inc.id, nearestMedic.id);
    expect(service.getIncident(inc.id)?.status).toBe(IncidentStatus.ACKNOWLEDGED);

    sim.advanceAll();
    expect(service.getIncident(inc.id)?.status).toBe(IncidentStatus.DISPATCHED);
  });
});
