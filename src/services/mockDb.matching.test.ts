import { describe, expect, it } from "vitest";

import type { Load, Truck } from "../types/tamp";
import { evaluateMatch } from "./mockDb";

const load: Load = {
  id: "LOAD-TEST-001",
  ownerId: "USER-OWNER-001",
  origin: {
    city: "Cape Town",
    province: "Western Cape",
    lat: -33.9249,
    lng: 18.4241,
  },
  destination: {
    city: "Johannesburg",
    province: "Gauteng",
    lat: -26.2041,
    lng: 28.0473,
  },
  cargoType: "Packaged food",
  description: "Test packaged-food load",
  weightKg: 12_000,
  volumeM3: 50,
  requiredVehicleType: "tautliner",
  pickupWindow: {
    start: "2026-07-30T08:00:00+02:00",
    end: "2026-07-30T15:00:00+02:00",
  },
  status: "open",
  createdAt: "2026-07-29T12:00:00+02:00",
};

const truck: Truck = {
  id: "TRK-TEST-001",
  transporterId: "USER-TRANSPORTER-001",
  vehicleType: "tautliner",
  displayName: "Test Tautliner",
  registrationDisplay: "CA TEST GP",
  capacityKg: 18_000,
  capacityM3: 60,
  currentLocation: {
    city: "Cape Town",
    province: "Western Cape",
    lat: -33.9249,
    lng: 18.4241,
  },
  availabilityWindow: {
    start: "2026-07-30T06:00:00+02:00",
    end: "2026-07-30T18:00:00+02:00",
  },
  status: "available",
};

describe("evaluateMatch", () => {
  it("returns an eligible 100-point match when every rule passes", () => {
    const result = evaluateMatch(load, truck);

    expect(result.eligible).toBe(true);
    expect(result.score).toBe(100);

    expect(result.ruleChecks.capacity.passed).toBe(true);
    expect(result.ruleChecks.compatibility.passed).toBe(true);
    expect(result.ruleChecks.availability.passed).toBe(true);
    expect(result.ruleChecks.location.passed).toBe(true);
  });

  it("rejects a truck whose capacity is below the load requirement", () => {
    const result = evaluateMatch(load, {
      ...truck,
      capacityKg: 11_000,
    });

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(70);
    expect(result.ruleChecks.capacity.passed).toBe(false);
  });

  it("rejects an incompatible vehicle type", () => {
    const result = evaluateMatch(load, {
      ...truck,
      vehicleType: "flatbed",
    });

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(65);
    expect(result.ruleChecks.compatibility.passed).toBe(false);
  });

  it("rejects a truck when its availability does not overlap pickup", () => {
    const result = evaluateMatch(load, {
      ...truck,
      availabilityWindow: {
        start: "2026-07-31T08:00:00+02:00",
        end: "2026-07-31T15:00:00+02:00",
      },
    });

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(75);
    expect(result.ruleChecks.availability.passed).toBe(false);
  });

  it("keeps the match eligible but removes location points for another city", () => {
    const result = evaluateMatch(load, {
      ...truck,
      currentLocation: {
        city: "Johannesburg",
        province: "Gauteng",
        lat: -26.2041,
        lng: 28.0473,
      },
    });

    expect(result.eligible).toBe(true);
    expect(result.score).toBe(90);
    expect(result.ruleChecks.location.passed).toBe(false);
  });
});
