import seedData from "../data/tamp-mock-data-za.json";

import type {
  AuditEvent,
  CreateDisputeInput,
  CreateLoadInput,
  CreateRatingInput,
  CreateTruckInput,
  Dispute,
  EntityId,
  Load,
  LoadStatus,
  Match,
  MatchDecisionType,
  MatchStatus,
  Rating,
  Receipt,
  TampDatabase,
  TrackingEvent,
  Trip,
  TripStatus,
  Truck,
  TruckStatus,
  User,
  UserRole,
  CargoType,
  LookupLocation,
  VehicleTypeLookup,
} from "../types/tamp";

const STORAGE_KEY = "tamp_db";
const DB_VERSION_KEY = "tamp_db_version";

const CURRENT_DB_VERSION = seedData.meta.version;

/* -------------------------------------------------------------------------- */
/* Storage helpers                                                             */
/* -------------------------------------------------------------------------- */

function cloneSeedData(): TampDatabase {
  return JSON.parse(JSON.stringify(seedData)) as TampDatabase;
}

function hasBrowserStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readStorage(key: string): string | null {
  if (!hasBrowserStorage()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string): void {
  if (!hasBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorage(key: string): void {
  if (!hasBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
}

/**
 * Creates the local mock database on first use.
 *
 * If the seed-data version changes, the mock database is reset automatically.
 * This makes schema/data changes easier during development.
 */
export function initializeMockDb(): TampDatabase {
  if (!hasBrowserStorage()) {
    return cloneSeedData();
  }

  const storedDb = readStorage(STORAGE_KEY);
  const storedVersion = readStorage(DB_VERSION_KEY);

  if (!storedDb || storedVersion !== CURRENT_DB_VERSION) {
    const freshDb = cloneSeedData();

    writeStorage(STORAGE_KEY, JSON.stringify(freshDb));
    writeStorage(DB_VERSION_KEY, CURRENT_DB_VERSION);

    return freshDb;
  }

  try {
    return JSON.parse(storedDb) as TampDatabase;
  } catch {
    return resetMockDb();
  }
}

/**
 * Returns the current database.
 */
export function getDb(): TampDatabase {
  return initializeMockDb();
}

/**
 * Replaces the current database.
 *
 * Keep this exported so test/demo utilities can deliberately update the entire
 * database, but normal feature code should prefer the narrower service methods.
 */
export function saveDb(db: TampDatabase): TampDatabase {
  if (hasBrowserStorage()) {
    writeStorage(STORAGE_KEY, JSON.stringify(db));
    writeStorage(DB_VERSION_KEY, CURRENT_DB_VERSION);
  }

  return db;
}

/**
 * Restores the original JSON fixture.
 */
export function resetMockDb(): TampDatabase {
  const freshDb = cloneSeedData();

  if (hasBrowserStorage()) {
    writeStorage(STORAGE_KEY, JSON.stringify(freshDb));
    writeStorage(DB_VERSION_KEY, CURRENT_DB_VERSION);
  }

  return freshDb;
}

/**
 * Completely removes the local mock database.
 * The next read will initialize it from the JSON seed again.
 */
export function clearMockDb(): void {
  removeStorage(STORAGE_KEY);
  removeStorage(DB_VERSION_KEY);
}

/* -------------------------------------------------------------------------- */
/* ID + timestamp helpers                                                      */
/* -------------------------------------------------------------------------- */

function nowIso(): string {
  return new Date().toISOString();
}

function nextNumericId(existingIds: string[], prefix: string): string {
  const max = existingIds.reduce((currentMax, id) => {
    const match = id.match(/(\d+)$/);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function createLoadId(db: TampDatabase): string {
  return nextNumericId(
    db.loads.map((load) => load.id),
    "LOAD",
  );
}

function createTruckId(db: TampDatabase): string {
  return nextNumericId(
    db.trucks.map((truck) => truck.id),
    "TRK",
  );
}

function createMatchId(db: TampDatabase): string {
  return nextNumericId(
    db.matches.map((match) => match.id),
    "MATCH",
  );
}

function createTripId(db: TampDatabase): string {
  return nextNumericId(
    db.trips.map((trip) => trip.id),
    "TRIP",
  );
}

function createRatingId(db: TampDatabase): string {
  return nextNumericId(
    db.ratings.map((rating) => rating.id),
    "RATING",
  );
}

function createDisputeId(db: TampDatabase): string {
  return nextNumericId(
    db.disputes.map((dispute) => dispute.id),
    "DSP",
  );
}

function createTrackingEventId(db: TampDatabase): string {
  return nextNumericId(
    db.trackingEvents.map((event) => event.id),
    "TE",
  );
}

function createAuditId(db: TampDatabase): string {
  return nextNumericId(
    db.auditEvents.map((event) => event.id),
    "AUD",
  );
}

function createContractId(db: TampDatabase): string {
  const existingNumbers = db.receipts
    .map((receipt) => receipt.contractId.match(/(\d+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => Number(match[1]));

  const nextNumber =
    existingNumbers.length === 0 ? 1 : Math.max(...existingNumbers) + 1;

  return `TAMP-ZA-${new Date().getFullYear()}-${String(nextNumber).padStart(
    4,
    "0",
  )}`;
}

/* -------------------------------------------------------------------------- */
/* Validation helpers                                                          */
/* -------------------------------------------------------------------------- */

function requireUser(db: TampDatabase, userId: EntityId): User {
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    throw new Error(`User "${userId}" was not found.`);
  }

  return user;
}

function requireRole(user: User, expectedRole: UserRole): void {
  if (user.role !== expectedRole) {
    throw new Error(
      `User "${user.id}" must have role "${expectedRole}" for this action.`,
    );
  }
}

function requireLoad(db: TampDatabase, loadId: EntityId): Load {
  const load = db.loads.find((item) => item.id === loadId);

  if (!load) {
    throw new Error(`Load "${loadId}" was not found.`);
  }

  return load;
}

function requireTruck(db: TampDatabase, truckId: EntityId): Truck {
  const truck = db.trucks.find((item) => item.id === truckId);

  if (!truck) {
    throw new Error(`Truck "${truckId}" was not found.`);
  }

  return truck;
}

function requireMatch(db: TampDatabase, matchId: EntityId): Match {
  const match = db.matches.find((item) => item.id === matchId);

  if (!match) {
    throw new Error(`Match "${matchId}" was not found.`);
  }

  return match;
}

function requireTrip(db: TampDatabase, tripId: EntityId): Trip {
  const trip = db.trips.find((item) => item.id === tripId);

  if (!trip) {
    throw new Error(`Trip "${tripId}" was not found.`);
  }

  return trip;
}

function windowsOverlap(
  first: { start: string; end: string },
  second: { start: string; end: string },
): boolean {
  const firstStart = new Date(first.start).getTime();
  const firstEnd = new Date(first.end).getTime();
  const secondStart = new Date(second.start).getTime();
  const secondEnd = new Date(second.end).getTime();

  return firstStart <= secondEnd && secondStart <= firstEnd;
}

/* -------------------------------------------------------------------------- */
/* Audit trail                                                                 */
/* -------------------------------------------------------------------------- */

export interface AddAuditEventInput {
  actorId: EntityId;
  action: string;
  entityType: string;
  entityId: EntityId;
  metadata?: AuditEvent["metadata"];
}

function appendAuditEvent(
  db: TampDatabase,
  input: AddAuditEventInput,
): AuditEvent {
  const event: AuditEvent = {
    id: createAuditId(db),
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    timestamp: nowIso(),
    metadata: input.metadata ?? {},
  };

  db.auditEvents.unshift(event);

  return event;
}

export function addAuditEvent(input: AddAuditEventInput): AuditEvent {
  const db = getDb();
  const event = appendAuditEvent(db, input);

  saveDb(db);

  return event;
}

export function getAuditEvents(): AuditEvent[] {
  return [...getDb().auditEvents];
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                     */
/* -------------------------------------------------------------------------- */

export function getLookupLocations(): LookupLocation[] {
  return getDb().lookups.locations.map((location) => ({
    ...location,
  }));
}

export function getCargoTypes(): CargoType[] {
  return [...getDb().lookups.cargoTypes];
}

export function getVehicleTypes(): VehicleTypeLookup[] {
  return getDb().lookups.vehicleTypes.map((vehicleType) => ({
    ...vehicleType,
    compatibleCargo: [...vehicleType.compatibleCargo],
  }));
}

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

export function getUsers(): User[] {
  return [...getDb().users];
}

export function getUserById(userId: EntityId): User | undefined {
  return getDb().users.find((user) => user.id === userId);
}

export function getUsersByRole(role: UserRole): User[] {
  return getDb().users.filter((user) => user.role === role);
}

export interface EnsureRegisteredUserProfileInput {
  id: EntityId;
  name: string;
  email: string;
  role: "freight_owner" | "transporter";
  company: string;
  createdAt: string;
}

export function ensureRegisteredUserProfile(
  input: EnsureRegisteredUserProfileInput,
): User {
  const db = getDb();

  const existingUser = db.users.find((user) => user.id === input.id);

  if (existingUser) {
    return existingUser;
  }

  const user: User = {
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    company: input.company.trim(),
    verificationStatus: "pending",
    complianceStatus: "pending",
    rating: null,
    createdAt: input.createdAt,
  };

  db.users.unshift(user);

  appendAuditEvent(db, {
    actorId: user.id,
    action: "USER_PROFILE_CREATED",
    entityType: "user",
    entityId: user.id,
    metadata: {
      role: user.role,
      company: user.company,
      source: "browser_registration",
    },
  });

  saveDb(db);

  return user;
}

/* -------------------------------------------------------------------------- */
/* Loads                                                                       */
/* -------------------------------------------------------------------------- */

export function getLoads(): Load[] {
  return [...getDb().loads];
}

export function getLoadById(loadId: EntityId): Load | undefined {
  return getDb().loads.find((load) => load.id === loadId);
}

export function getLoadsByOwner(ownerId: EntityId): Load[] {
  return getDb().loads.filter((load) => load.ownerId === ownerId);
}

export function createLoad(ownerId: EntityId, input: CreateLoadInput): Load {
  const db = getDb();
  const owner = requireUser(db, ownerId);

  requireRole(owner, "freight_owner");

  if (input.weightKg <= 0) {
    throw new Error("Load weight must be greater than zero.");
  }

  if (input.volumeM3 <= 0) {
    throw new Error("Load volume must be greater than zero.");
  }

  if (
    new Date(input.pickupWindow.start).getTime() >=
    new Date(input.pickupWindow.end).getTime()
  ) {
    throw new Error("Pickup window end time must be after its start time.");
  }

  const load: Load = {
    ...input,
    id: createLoadId(db),
    ownerId,
    status: "open",
    createdAt: nowIso(),
  };

  db.loads.unshift(load);

  appendAuditEvent(db, {
    actorId: ownerId,
    action: "LOAD_CREATED",
    entityType: "load",
    entityId: load.id,
    metadata: {
      origin: load.origin.city,
      destination: load.destination.city,
      cargoType: load.cargoType,
      weightKg: load.weightKg,
    },
  });

  saveDb(db);

  return load;
}

export function updateLoadStatus(
  loadId: EntityId,
  status: LoadStatus,
  actorId: EntityId,
): Load {
  const db = getDb();
  requireUser(db, actorId);

  const load = requireLoad(db, loadId);
  load.status = status;

  appendAuditEvent(db, {
    actorId,
    action: "LOAD_STATUS_UPDATED",
    entityType: "load",
    entityId: load.id,
    metadata: { status },
  });

  saveDb(db);

  return load;
}

/* -------------------------------------------------------------------------- */
/* Trucks                                                                      */
/* -------------------------------------------------------------------------- */

export function getTrucks(): Truck[] {
  return [...getDb().trucks];
}

export function getTruckById(truckId: EntityId): Truck | undefined {
  return getDb().trucks.find((truck) => truck.id === truckId);
}

export function getTrucksByTransporter(transporterId: EntityId): Truck[] {
  return getDb().trucks.filter(
    (truck) => truck.transporterId === transporterId,
  );
}

export function createTruck(
  transporterId: EntityId,
  input: CreateTruckInput,
): Truck {
  const db = getDb();
  const transporter = requireUser(db, transporterId);

  requireRole(transporter, "transporter");

  if (input.capacityKg <= 0) {
    throw new Error("Truck capacity must be greater than zero.");
  }

  if (input.capacityM3 <= 0) {
    throw new Error("Truck volume capacity must be greater than zero.");
  }

  if (
    new Date(input.availabilityWindow.start).getTime() >=
    new Date(input.availabilityWindow.end).getTime()
  ) {
    throw new Error(
      "Availability window end time must be after its start time.",
    );
  }

  const truck: Truck = {
    ...input,
    id: createTruckId(db),
    transporterId,
    status: "available",
  };

  db.trucks.unshift(truck);

  appendAuditEvent(db, {
    actorId: transporterId,
    action: "TRUCK_POSTED",
    entityType: "truck",
    entityId: truck.id,
    metadata: {
      city: truck.currentLocation.city,
      vehicleType: truck.vehicleType,
      capacityKg: truck.capacityKg,
    },
  });

  saveDb(db);

  return truck;
}

export function updateTruckStatus(
  truckId: EntityId,
  status: TruckStatus,
  actorId: EntityId,
): Truck {
  const db = getDb();
  requireUser(db, actorId);

  const truck = requireTruck(db, truckId);
  truck.status = status;

  appendAuditEvent(db, {
    actorId,
    action: "TRUCK_STATUS_UPDATED",
    entityType: "truck",
    entityId: truck.id,
    metadata: { status },
  });

  saveDb(db);

  return truck;
}

/* -------------------------------------------------------------------------- */
/* Matching                                                                    */
/* -------------------------------------------------------------------------- */

export interface MatchEvaluation {
  eligible: boolean;
  score: number;
  reasons: string[];
  ruleChecks: Match["ruleChecks"];
}

/**
 * Transparent MVP matching rule:
 * - capacity must be sufficient
 * - vehicle type must match the required type
 * - availability windows must overlap
 * - same-city location is preferred
 *
 * Capacity, compatibility and availability are hard requirements.
 * Location affects ranking but does not reject an otherwise valid match.
 */
export function evaluateMatch(load: Load, truck: Truck): MatchEvaluation {
  const capacityPassed =
    truck.capacityKg >= load.weightKg && truck.capacityM3 >= load.volumeM3;

  const compatibilityPassed = truck.vehicleType === load.requiredVehicleType;

  const availabilityPassed = windowsOverlap(
    load.pickupWindow,
    truck.availabilityWindow,
  );

  const locationPassed =
    truck.currentLocation.city.toLowerCase() === load.origin.city.toLowerCase();

  const eligible = capacityPassed && compatibilityPassed && availabilityPassed;

  let score = 0;

  if (capacityPassed) score += 30;
  if (compatibilityPassed) score += 35;
  if (availabilityPassed) score += 25;
  if (locationPassed) score += 10;

  const ruleChecks: Match["ruleChecks"] = {
    capacity: {
      passed: capacityPassed,
      reason: capacityPassed
        ? `${truck.capacityKg.toLocaleString("en-ZA")} kg truck capacity covers the ${load.weightKg.toLocaleString("en-ZA")} kg load.`
        : `Truck capacity is below the load requirement.`,
    },
    compatibility: {
      passed: compatibilityPassed,
      reason: compatibilityPassed
        ? `Truck type matches the required "${load.requiredVehicleType}" vehicle type.`
        : `Truck type "${truck.vehicleType}" does not match required type "${load.requiredVehicleType}".`,
    },
    location: {
      passed: locationPassed,
      reason: locationPassed
        ? `Truck and load origin are both ${load.origin.city}.`
        : `Truck is in ${truck.currentLocation.city}; pickup is in ${load.origin.city}.`,
    },
    availability: {
      passed: availabilityPassed,
      reason: availabilityPassed
        ? "Truck availability overlaps the pickup window."
        : "Truck availability does not overlap the pickup window.",
    },
  };

  const reasons = Object.values(ruleChecks).map((rule) => rule.reason);

  return {
    eligible,
    score,
    reasons,
    ruleChecks,
  };
}

export function getMatches(): Match[] {
  return [...getDb().matches];
}

export function getMatchById(matchId: EntityId): Match | undefined {
  return getDb().matches.find((match) => match.id === matchId);
}

export function getMatchesForLoad(loadId: EntityId): Match[] {
  return getDb().matches.filter((match) => match.loadId === loadId);
}

export function getMatchesForTruck(truckId: EntityId): Match[] {
  return getDb().matches.filter((match) => match.truckId === truckId);
}

export function generateMatchesForLoad(loadId: EntityId): Match[] {
  const db = getDb();
  const load = requireLoad(db, loadId);
  if (load.status !== "open") {
    throw new Error(
      `Only open loads can generate matches. Current status: "${load.status}".`,
    );
  }
  const existingTruckIds = new Set(
    db.matches
      .filter((match) => match.loadId === loadId)
      .map((match) => match.truckId),
  );

  const createdMatches: Match[] = [];

  for (const truck of db.trucks) {
    if (existingTruckIds.has(truck.id)) {
      continue;
    }

    if (truck.status !== "available") {
      continue;
    }

    const evaluation = evaluateMatch(load, truck);

    const match: Match = {
      id: createMatchId(db),
      loadId: load.id,
      truckId: truck.id,
      score: evaluation.score,
      eligible: evaluation.eligible,
      ruleChecks: evaluation.ruleChecks,
      reasons: evaluation.reasons,
      status: evaluation.eligible ? "recommended" : "rejected",
      createdAt: nowIso(),
      decision: evaluation.eligible
        ? null
        : {
            actorId: "SYSTEM",
            decision: "rule_rejected",
            timestamp: nowIso(),
          },
    };

    db.matches.push(match);
    createdMatches.push(match);

    appendAuditEvent(db, {
      actorId: "SYSTEM",
      action: evaluation.eligible ? "MATCH_RECOMMENDED" : "MATCH_RULE_REJECTED",
      entityType: "match",
      entityId: match.id,
      metadata: {
        score: match.score,
        eligible: match.eligible,
      },
    });
  }

  saveDb(db);

  return createdMatches.sort((a, b) => b.score - a.score);
}

function setMatchDecision(
  db: TampDatabase,
  match: Match,
  actorId: EntityId,
  decision: MatchDecisionType,
  status: MatchStatus,
): void {
  match.status = status;
  match.decision = {
    actorId,
    decision,
    timestamp: nowIso(),
  };
}

function requireMatchDecisionAccess(
  actor: User,
  load: Load,
  truck: Truck,
): void {
  const ownsLoad = actor.role === "freight_owner" && load.ownerId === actor.id;

  const ownsTruck =
    actor.role === "transporter" && truck.transporterId === actor.id;

  if (!ownsLoad && !ownsTruck) {
    throw new Error(
      "You can only make decisions on matches connected to your own load or truck.",
    );
  }
}

export interface AcceptMatchResult {
  match: Match;
  receipt: Receipt;
  trip: Trip;
}

export function acceptMatch(
  matchId: EntityId,
  actorId: EntityId,
): AcceptMatchResult {
  const db = getDb();

  const actor = requireUser(db, actorId);
  const match = requireMatch(db, matchId);

  if (!match.eligible) {
    throw new Error("An ineligible match cannot be accepted.");
  }

  if (match.status !== "recommended") {
    throw new Error(
      `Only recommended matches can be accepted. Current status: "${match.status}".`,
    );
  }

  const load = requireLoad(db, match.loadId);
  const truck = requireTruck(db, match.truckId);

  requireMatchDecisionAccess(actor, load, truck);

  if (load.status !== "open") {
    throw new Error(
      `Only open loads can accept a match. Current status: "${load.status}".`,
    );
  }

  if (truck.status !== "available") {
    throw new Error(
      `Only available trucks can be accepted. Current status: "${truck.status}".`,
    );
  }

  setMatchDecision(db, match, actorId, "accepted", "accepted");

  load.status = "matched";
  truck.status = "reserved";

  /*
   * Once one engagement is accepted:
   * - every other recommendation for this load expires;
   * - every recommendation using the reserved truck expires.
   */
  for (const otherMatch of db.matches) {
    if (otherMatch.id === match.id || otherMatch.status !== "recommended") {
      continue;
    }

    const conflictsWithLoad = otherMatch.loadId === load.id;

    const conflictsWithTruck = otherMatch.truckId === truck.id;

    if (!conflictsWithLoad && !conflictsWithTruck) {
      continue;
    }

    otherMatch.status = "expired";

    let reason = "conflicting_match_accepted";

    if (conflictsWithLoad && conflictsWithTruck) {
      reason = "same_load_and_truck";
    } else if (conflictsWithLoad) {
      reason = "another_truck_accepted_for_load";
    } else if (conflictsWithTruck) {
      reason = "truck_reserved_for_another_load";
    }

    appendAuditEvent(db, {
      actorId: "SYSTEM",
      action: "MATCH_EXPIRED",
      entityType: "match",
      entityId: otherMatch.id,
      metadata: {
        reason,
        acceptedMatchId: match.id,
        loadId: otherMatch.loadId,
        truckId: otherMatch.truckId,
      },
    });
  }

  const receipt: Receipt = {
    contractId: createContractId(db),
    matchId: match.id,
    decision: "accepted",
    actorId,
    timestamp: nowIso(),
    ipAddress: "192.0.2.10",
    userAgent: "TAMP-Frontend-Demo/1.0",
    status: "confirmed",
  };

  db.receipts.unshift(receipt);

  const trip: Trip = {
    id: createTripId(db),
    matchId: match.id,
    contractId: receipt.contractId,
    status: "confirmed",
    progressPercent: 0,
    origin: load.origin.city,
    destination: load.destination.city,
    lastUpdatedAt: nowIso(),
  };

  db.trips.unshift(trip);

  appendAuditEvent(db, {
    actorId,
    action: "MATCH_ACCEPTED",
    entityType: "match",
    entityId: match.id,
    metadata: {
      loadId: load.id,
      truckId: truck.id,
      contractId: receipt.contractId,
    },
  });

  appendAuditEvent(db, {
    actorId: "SYSTEM",
    action: "RECEIPT_CREATED",
    entityType: "receipt",
    entityId: receipt.contractId,
    metadata: {
      matchId: match.id,
      tripId: trip.id,
    },
  });

  saveDb(db);

  return {
    match,
    receipt,
    trip,
  };
}

export function rejectMatch(matchId: EntityId, actorId: EntityId): Match {
  const db = getDb();

  const actor = requireUser(db, actorId);
  const match = requireMatch(db, matchId);

  if (match.status !== "recommended") {
    throw new Error(
      `Only recommended matches can be rejected. Current status: "${match.status}".`,
    );
  }

  const load = requireLoad(db, match.loadId);
  const truck = requireTruck(db, match.truckId);

  requireMatchDecisionAccess(actor, load, truck);

  setMatchDecision(db, match, actorId, "rejected", "rejected");

  appendAuditEvent(db, {
    actorId,
    action: "MATCH_REJECTED",
    entityType: "match",
    entityId: match.id,
    metadata: {
      loadId: load.id,
      truckId: truck.id,
    },
  });

  saveDb(db);

  return match;
}

/* -------------------------------------------------------------------------- */
/* Receipts                                                                    */
/* -------------------------------------------------------------------------- */

export function getReceipts(): Receipt[] {
  return [...getDb().receipts];
}

export function getReceiptByMatchId(matchId: EntityId): Receipt | undefined {
  return getDb().receipts.find((receipt) => receipt.matchId === matchId);
}

/* -------------------------------------------------------------------------- */
/* Trips + tracking                                                            */
/* -------------------------------------------------------------------------- */

const TRIP_PROGRESS: Record<TripStatus, number> = {
  confirmed: 0,
  at_pickup: 10,
  loaded: 20,
  in_transit: 60,
  at_delivery: 90,
  completed: 100,
};

export function getTrips(): Trip[] {
  return [...getDb().trips];
}

export function getTripById(tripId: EntityId): Trip | undefined {
  return getDb().trips.find((trip) => trip.id === tripId);
}

export function getTripByMatchId(matchId: EntityId): Trip | undefined {
  return getDb().trips.find((trip) => trip.matchId === matchId);
}

export function getTrackingEvents(tripId: EntityId): TrackingEvent[] {
  return getDb()
    .trackingEvents.filter((event) => event.tripId === tripId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
}

export interface AddTrackingEventInput {
  status: TripStatus;
  lat: number;
  lng: number;
  label: string;
}

export function addTrackingEvent(
  tripId: EntityId,
  actorId: EntityId,
  input: AddTrackingEventInput,
): TrackingEvent {
  const db = getDb();
  requireUser(db, actorId);

  const trip = requireTrip(db, tripId);

  const event: TrackingEvent = {
    id: createTrackingEventId(db),
    tripId,
    status: input.status,
    lat: input.lat,
    lng: input.lng,
    label: input.label,
    timestamp: nowIso(),
    coordinateType: "mock_route_point",
  };

  db.trackingEvents.push(event);

  trip.status = input.status;
  trip.progressPercent = TRIP_PROGRESS[input.status];
  trip.lastUpdatedAt = event.timestamp;

  if (input.status === "completed") {
    const match = requireMatch(db, trip.matchId);
    const load = requireLoad(db, match.loadId);
    const truck = requireTruck(db, match.truckId);

    match.status = "completed";
    load.status = "completed";
    truck.status = "available";
  } else if (
    input.status === "loaded" ||
    input.status === "in_transit" ||
    input.status === "at_delivery"
  ) {
    const match = requireMatch(db, trip.matchId);
    const load = requireLoad(db, match.loadId);
    const truck = requireTruck(db, match.truckId);

    load.status = "in_transit";
    truck.status = "in_transit";
  }

  appendAuditEvent(db, {
    actorId,
    action: "TRIP_STATUS_UPDATED",
    entityType: "trip",
    entityId: trip.id,
    metadata: {
      status: input.status,
      progressPercent: trip.progressPercent,
    },
  });

  saveDb(db);

  return event;
}

/* -------------------------------------------------------------------------- */
/* Ratings                                                                     */
/* -------------------------------------------------------------------------- */

export function getRatings(): Rating[] {
  return [...getDb().ratings];
}

export function getRatingsForUser(userId: EntityId): Rating[] {
  return getDb().ratings.filter((rating) => rating.reviewedUserId === userId);
}

export function createRating(input: CreateRatingInput): Rating {
  const db = getDb();

  requireUser(db, input.reviewerId);
  requireUser(db, input.reviewedUserId);

  const trip = requireTrip(db, input.tripId);

  if (trip.status !== "completed") {
    throw new Error("Ratings can only be submitted after a completed trip.");
  }

  if (input.reviewerId === input.reviewedUserId) {
    throw new Error("A user cannot rate themselves.");
  }

  const existingRating = db.ratings.find(
    (rating) =>
      rating.tripId === input.tripId && rating.reviewerId === input.reviewerId,
  );

  if (existingRating) {
    throw new Error("This user has already rated this trip.");
  }

  const rating: Rating = {
    id: createRatingId(db),
    tripId: input.tripId,
    reviewerId: input.reviewerId,
    reviewedUserId: input.reviewedUserId,
    score: input.score,
    comment: input.comment?.trim() ?? "",
    timestamp: nowIso(),
  };

  db.ratings.unshift(rating);

  const reviewedUser = requireUser(db, input.reviewedUserId);
  const reviewedUserRatings = db.ratings.filter(
    (item) => item.reviewedUserId === input.reviewedUserId,
  );

  reviewedUser.rating =
    Math.round(
      (reviewedUserRatings.reduce((sum, item) => sum + item.score, 0) /
        reviewedUserRatings.length) *
        10,
    ) / 10;

  appendAuditEvent(db, {
    actorId: input.reviewerId,
    action: "RATING_SUBMITTED",
    entityType: "rating",
    entityId: rating.id,
    metadata: {
      tripId: input.tripId,
      reviewedUserId: input.reviewedUserId,
      score: input.score,
    },
  });

  saveDb(db);

  return rating;
}

/* -------------------------------------------------------------------------- */
/* Disputes                                                                    */
/* -------------------------------------------------------------------------- */

export function getDisputes(): Dispute[] {
  return [...getDb().disputes];
}

export function createDispute(input: CreateDisputeInput): Dispute {
  const db = getDb();

  requireUser(db, input.raisedBy);
  requireUser(db, input.againstUserId);
  requireTrip(db, input.tripId);

  const admin = db.users.find((user) => user.role === "admin");

  if (!admin) {
    throw new Error("No administrator is available to receive the dispute.");
  }

  const dispute: Dispute = {
    id: createDisputeId(db),
    tripId: input.tripId,
    raisedBy: input.raisedBy,
    againstUserId: input.againstUserId,
    category: input.category,
    summary: input.summary,
    status: "open",
    priority: input.priority,
    createdAt: nowIso(),
    assignedTo: admin.id,
  };

  db.disputes.unshift(dispute);

  appendAuditEvent(db, {
    actorId: input.raisedBy,
    action: "DISPUTE_CREATED",
    entityType: "dispute",
    entityId: dispute.id,
    metadata: {
      tripId: dispute.tripId,
      priority: dispute.priority,
    },
  });

  saveDb(db);

  return dispute;
}

export function resolveDispute(
  disputeId: EntityId,
  adminId: EntityId,
): Dispute {
  const db = getDb();
  const admin = requireUser(db, adminId);

  requireRole(admin, "admin");

  const dispute = db.disputes.find((item) => item.id === disputeId);

  if (!dispute) {
    throw new Error(`Dispute "${disputeId}" was not found.`);
  }

  dispute.status = "resolved";
  dispute.resolvedAt = nowIso();

  appendAuditEvent(db, {
    actorId: adminId,
    action: "DISPUTE_RESOLVED",
    entityType: "dispute",
    entityId: dispute.id,
    metadata: {
      status: "resolved",
    },
  });

  saveDb(db);

  return dispute;
}

/* -------------------------------------------------------------------------- */
/* Dashboard KPIs                                                              */
/* -------------------------------------------------------------------------- */

export interface FreightOwnerKpis {
  totalLoads: number;
  openLoads: number;
  activeMatches: number;
  tripsInTransit: number;
  completedTrips: number;
}

export interface TransporterKpis {
  totalTrucks: number;
  availableTrucks: number;
  recommendedLoads: number;
  activeTrips: number;
  averageRating: number | null;
}

export interface AdminKpis {
  totalUsers: number;
  verifiedUsers: number;
  pendingComplianceReviews: number;
  openDisputes: number;
  loadsPosted: number;
  trucksPosted: number;
  eligibleMatches: number;
  acceptedMatches: number;
  activeTrips: number;
}

export function getFreightOwnerKpis(ownerId: EntityId): FreightOwnerKpis {
  const db = getDb();

  const ownerLoads = db.loads.filter((load) => load.ownerId === ownerId);
  const ownerLoadIds = new Set(ownerLoads.map((load) => load.id));

  const ownerMatches = db.matches.filter((match) =>
    ownerLoadIds.has(match.loadId),
  );

  const ownerMatchIds = new Set(ownerMatches.map((match) => match.id));

  const ownerTrips = db.trips.filter((trip) => ownerMatchIds.has(trip.matchId));

  return {
    totalLoads: ownerLoads.length,
    openLoads: ownerLoads.filter((load) => load.status === "open").length,
    activeMatches: ownerMatches.filter(
      (match) => match.status === "recommended" || match.status === "accepted",
    ).length,
    tripsInTransit: ownerTrips.filter((trip) => trip.status === "in_transit")
      .length,
    completedTrips: ownerTrips.filter((trip) => trip.status === "completed")
      .length,
  };
}

export function getTransporterKpis(transporterId: EntityId): TransporterKpis {
  const db = getDb();

  const trucks = db.trucks.filter(
    (truck) => truck.transporterId === transporterId,
  );

  const truckIds = new Set(trucks.map((truck) => truck.id));

  const matches = db.matches.filter((match) => truckIds.has(match.truckId));

  const matchIds = new Set(matches.map((match) => match.id));

  const trips = db.trips.filter((trip) => matchIds.has(trip.matchId));

  const transporter = requireUser(db, transporterId);

  return {
    totalTrucks: trucks.length,
    availableTrucks: trucks.filter((truck) => truck.status === "available")
      .length,
    recommendedLoads: matches.filter((match) => match.status === "recommended")
      .length,
    activeTrips: trips.filter(
      (trip) => trip.status !== "completed" && trip.status !== "confirmed",
    ).length,
    averageRating: transporter.rating,
  };
}

export function getAdminKpis(): AdminKpis {
  const db = getDb();

  return {
    totalUsers: db.users.length,
    verifiedUsers: db.users.filter(
      (user) => user.verificationStatus === "verified",
    ).length,
    pendingComplianceReviews: db.complianceDocuments.filter(
      (document) => document.status === "under_review",
    ).length,
    openDisputes: db.disputes.filter((dispute) => dispute.status === "open")
      .length,
    loadsPosted: db.loads.length,
    trucksPosted: db.trucks.length,
    eligibleMatches: db.matches.filter((match) => match.eligible).length,
    acceptedMatches: db.matches.filter((match) => match.status === "accepted")
      .length,
    activeTrips: db.trips.filter((trip) => trip.status !== "completed").length,
  };
}
