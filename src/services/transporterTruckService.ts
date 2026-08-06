import {
  addAuditEvent,
  createTruck,
  getDb,
  getTruckById,
  getTrucks,
  saveDb,
  updateTruckStatus,
} from "./mockDb";
import type {
  CreateTruckInput,
  EntityId,
  Truck,
  TruckStatus,
} from "../types/tamp";

const normalizeRegistration = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

function validateTruckInput(input: CreateTruckInput): void {
  if (!input.displayName.trim()) {
    throw new Error("Truck name is required.");
  }

  if (!input.registrationDisplay.trim()) {
    throw new Error("Registration number is required.");
  }

  if (!Number.isFinite(input.capacityKg) || input.capacityKg <= 0) {
    throw new Error("Truck capacity must be greater than zero.");
  }

  if (!Number.isFinite(input.capacityM3) || input.capacityM3 <= 0) {
    throw new Error("Truck volume capacity must be greater than zero.");
  }

  const availabilityStart = new Date(input.availabilityWindow.start).getTime();
  const availabilityEnd = new Date(input.availabilityWindow.end).getTime();

  if (!Number.isFinite(availabilityStart) || !Number.isFinite(availabilityEnd)) {
    throw new Error("Enter a valid availability window.");
  }

  if (availabilityStart >= availabilityEnd) {
    throw new Error("Availability end time must be after its start time.");
  }
}

function assertTransporterOwnsTruck(
  transporterId: EntityId,
  truck: Truck | undefined,
): asserts truck is Truck {
  if (!truck) {
    throw new Error("Truck was not found.");
  }

  if (truck.transporterId !== transporterId) {
    throw new Error("You can only manage trucks that belong to your account.");
  }
}

function assertUniqueRegistration(
  registrationDisplay: string,
  ignoredTruckId?: EntityId,
): void {
  const normalizedRegistration = normalizeRegistration(registrationDisplay);
  const duplicate = getTrucks().some(
    (truck) =>
      truck.id !== ignoredTruckId &&
      normalizeRegistration(truck.registrationDisplay) === normalizedRegistration,
  );

  if (duplicate) {
    throw new Error("A truck with this registration number already exists.");
  }
}

export function createTransporterTruck(
  transporterId: EntityId,
  input: CreateTruckInput,
): Truck {
  validateTruckInput(input);
  assertUniqueRegistration(input.registrationDisplay);

  return createTruck(transporterId, {
    ...input,
    displayName: input.displayName.trim(),
    registrationDisplay: normalizeRegistration(input.registrationDisplay),
  });
}

export function updateTransporterTruck(
  transporterId: EntityId,
  truckId: EntityId,
  input: CreateTruckInput,
): Truck {
  validateTruckInput(input);
  assertUniqueRegistration(input.registrationDisplay, truckId);

  const db = getDb();
  const transporter = db.users.find((user) => user.id === transporterId);

  if (!transporter || transporter.role !== "transporter") {
    throw new Error("A valid Transporter account is required for this action.");
  }

  const truck = db.trucks.find((item) => item.id === truckId);
  assertTransporterOwnsTruck(transporterId, truck);

  if (truck.status === "reserved" || truck.status === "in_transit") {
    throw new Error("A reserved or in-transit truck cannot be edited.");
  }

  Object.assign(truck, {
    ...input,
    displayName: input.displayName.trim(),
    registrationDisplay: normalizeRegistration(input.registrationDisplay),
  });

  saveDb(db);
  addAuditEvent({
    actorId: transporterId,
    action: "TRUCK_UPDATED",
    entityType: "truck",
    entityId: truck.id,
    metadata: {
      city: truck.currentLocation.city,
      vehicleType: truck.vehicleType,
      capacityKg: truck.capacityKg,
    },
  });

  return truck;
}

export function setTransporterTruckAvailability(
  transporterId: EntityId,
  truckId: EntityId,
  status: Extract<TruckStatus, "available" | "unavailable">,
): Truck {
  const truck = getTruckById(truckId);
  assertTransporterOwnsTruck(transporterId, truck);

  if (truck.status === "reserved" || truck.status === "in_transit") {
    throw new Error("Availability is controlled by the active booking for this truck.");
  }

  return updateTruckStatus(truckId, status, transporterId);
}
