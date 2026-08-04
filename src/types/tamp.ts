/**
 * TAMP domain types
 *
 * These interfaces mirror the structure of `tamp-mock-data-za.json`.
 * Keep this file free of mock values: it describes the application's
 * data contracts only.
 */

export type ISODateTime = string;
export type EntityId = string;

export type UserRole = "freight_owner" | "transporter" | "admin";

export type VerificationStatus = "pending" | "verified" | "suspended";
export type ComplianceStatus = "approved" | "review" | "pending" | "rejected";

export type LoadStatus =
  | "draft"
  | "open"
  | "matched"
  | "in_transit"
  | "completed"
  | "cancelled";

export type TruckStatus =
  | "available"
  | "reserved"
  | "in_transit"
  | "unavailable";

export type MatchStatus =
  | "recommended"
  | "accepted"
  | "rejected"
  | "expired"
  | "completed";

export type TripStatus =
  | "confirmed"
  | "at_pickup"
  | "loaded"
  | "in_transit"
  | "at_delivery"
  | "completed";

export type MatchDecisionType = "accepted" | "rejected" | "rule_rejected";

export type ReceiptStatus = "confirmed";

export type ComplianceDocumentStatus = "approved" | "under_review" | "rejected";

export type DisputeStatus = "open" | "resolved";
export type DisputePriority = "low" | "medium" | "high";

export type CoordinateType = "real_city_reference" | "mock_route_point";

export type VehicleTypeId =
  | "reefer"
  | "tautliner"
  | "flatbed"
  | "side_tipper"
  | "box_body";

export type CargoType =
  | "Fresh produce"
  | "Frozen food"
  | "Dairy"
  | "Packaged food"
  | "Palletised goods"
  | "Automotive parts"
  | "General freight"
  | "Timber"
  | "Steel"
  | "Machinery"
  | "Containerised cargo"
  | "Minerals"
  | "Coal"
  | "Aggregate"
  | "Retail goods"
  | "Electronics";

export type SouthAfricanProvince =
  | "Eastern Cape"
  | "Free State"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "Northern Cape"
  | "North West"
  | "Western Cape";

export type LocationType = "metro" | "metro_port" | "city" | "port";

export interface SourceReference {
  name: string;
  url: string;
  usedFor: string;
}

export interface TampMeta {
  project: string;
  datasetName: string;
  version: string;
  generatedFor: string;
  country: string;
  countryCode: "ZA";
  currency: "ZAR";
  timeZone: "Africa/Johannesburg";
  syntheticDataNotice: string;
  sourceReferences: SourceReference[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location extends Coordinates {
  city: string;
  province: SouthAfricanProvince;
}

export interface LookupLocation extends Location {
  type: LocationType;
}

export interface TimeWindow {
  start: ISODateTime;
  end: ISODateTime;
}

export interface VehicleTypeLookup {
  id: VehicleTypeId;
  label: string;
  compatibleCargo: CargoType[];
}

export interface StatusLookups {
  user: VerificationStatus[];
  load: LoadStatus[];
  truck: TruckStatus[];
  match: MatchStatus[];
  trip: TripStatus[];
}

export interface TampLookups {
  provinces: SouthAfricanProvince[];
  locations: LookupLocation[];
  vehicleTypes: VehicleTypeLookup[];
  cargoTypes: CargoType[];
  statuses: StatusLookups;
}

export interface User {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  phoneNumber?: string;
  profileImage?: string | null;
  verificationStatus: VerificationStatus;
  complianceStatus: ComplianceStatus;
  rating: number | null;
  createdAt: ISODateTime;
}

export interface ComplianceDocument {
  id: EntityId;
  userId: EntityId;
  documentType: string;
  reference: string;
  fileName: string;
  status: ComplianceDocumentStatus;
  reviewedBy: EntityId | null;
  reviewedAt: ISODateTime | null;
}

export interface Load {
  id: EntityId;
  ownerId: EntityId;
  origin: Location;
  destination: Location;
  cargoType: CargoType;
  description: string;
  weightKg: number;
  volumeM3: number;
  requiredVehicleType: VehicleTypeId;
  pickupWindow: TimeWindow;
  status: LoadStatus;
  createdAt: ISODateTime;
}

export interface Truck {
  id: EntityId;
  transporterId: EntityId;
  vehicleType: VehicleTypeId;
  displayName: string;
  registrationDisplay: string;
  capacityKg: number;
  capacityM3: number;
  currentLocation: Location;
  availabilityWindow: TimeWindow;
  status: TruckStatus;
}

export interface MatchRuleCheck {
  passed: boolean;
  reason: string;
}

export interface MatchRuleChecks {
  capacity: MatchRuleCheck;
  compatibility: MatchRuleCheck;
  location: MatchRuleCheck;
  availability: MatchRuleCheck;
}

export interface MatchDecision {
  actorId: EntityId;
  decision: MatchDecisionType;
  timestamp: ISODateTime;
}

export interface Match {
  id: EntityId;
  loadId: EntityId;
  truckId: EntityId;
  score: number;
  eligible: boolean;
  ruleChecks: MatchRuleChecks;
  reasons: string[];
  status: MatchStatus;
  createdAt: ISODateTime;
  decision: MatchDecision | null;
}

export interface Receipt {
  contractId: EntityId;
  matchId: EntityId;
  decision: "accepted" | "rejected";
  actorId: EntityId;
  timestamp: ISODateTime;
  ipAddress: string;
  userAgent: string;
  status: ReceiptStatus;
}

export interface Trip {
  id: EntityId;
  matchId: EntityId;
  contractId: EntityId;
  status: TripStatus;
  progressPercent: number;
  origin: string;
  destination: string;
  lastUpdatedAt: ISODateTime;
}

export interface TrackingEvent {
  id: EntityId;
  tripId: EntityId;
  status: TripStatus;
  lat: number;
  lng: number;
  label: string;
  timestamp: ISODateTime;
  coordinateType: CoordinateType;
  demoFutureEvent?: boolean;
}

export type RatingScore = 1 | 2 | 3 | 4 | 5;

export interface Rating {
  id: EntityId;
  tripId: EntityId;
  reviewerId: EntityId;
  reviewedUserId: EntityId;
  score: RatingScore;
  comment: string;
  timestamp: ISODateTime;
}

export interface Dispute {
  id: EntityId;
  tripId: EntityId;
  raisedBy: EntityId;
  againstUserId: EntityId;
  category: string;
  summary: string;
  status: DisputeStatus;
  priority: DisputePriority;
  createdAt: ISODateTime;
  assignedTo: EntityId;
  resolvedAt?: ISODateTime;
}

export type AuditMetadata = Record<
  string,
  string | number | boolean | string[] | null
>;

export interface AuditEvent {
  id: EntityId;
  actorId: EntityId;
  action: string;
  entityType: string;
  entityId: EntityId;
  timestamp: ISODateTime;
  metadata: AuditMetadata;
}

export interface FreightOwnerDashboardSeed {
  openLoads: number;
  activeMatches: number;
  tripsInTransit: number;
  completedTrips: number;
}

export interface TransporterDashboardSeed {
  availableTrucks: number;
  recommendedLoads: number;
  activeTrips: number;
  averageRating: number;
}

export interface AdminDashboardSeed {
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

export interface DashboardSeed {
  freightOwner: FreightOwnerDashboardSeed;
  transporter: TransporterDashboardSeed;
  admin: AdminDashboardSeed;
}

/**
 * Complete shape of `tamp-mock-data-za.json`.
 */
export interface TampDatabase {
  meta: TampMeta;
  lookups: TampLookups;
  users: User[];
  complianceDocuments: ComplianceDocument[];
  loads: Load[];
  trucks: Truck[];
  matches: Match[];
  receipts: Receipt[];
  trips: Trip[];
  trackingEvents: TrackingEvent[];
  ratings: Rating[];
  disputes: Dispute[];
  auditEvents: AuditEvent[];
  dashboardSeed: DashboardSeed;
}

/* -------------------------------------------------------------------------- */
/* Form/input types                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Fields entered by a Freight Owner.
 * IDs, status and timestamps should be generated by the data/service layer.
 */
export type CreateLoadInput = Omit<
  Load,
  "id" | "ownerId" | "status" | "createdAt"
>;

/**
 * Fields entered by a Transporter.
 * IDs and status should be generated by the data/service layer.
 */
export type CreateTruckInput = Omit<Truck, "id" | "transporterId" | "status">;

export interface CreateRatingInput {
  tripId: EntityId;
  reviewerId: EntityId;
  reviewedUserId: EntityId;
  score: RatingScore;
  comment: string;
}

export interface CreateDisputeInput {
  tripId: EntityId;
  raisedBy: EntityId;
  againstUserId: EntityId;
  category: string;
  summary: string;
  priority: DisputePriority;
}

/* -------------------------------------------------------------------------- */
/* Useful UI/view-model types                                                  */
/* -------------------------------------------------------------------------- */

export interface MatchWithDetails extends Match {
  load: Load;
  truck: Truck;
  freightOwner?: User;
  transporter?: User;
}

export interface TripWithDetails extends Trip {
  match?: Match;
  load?: Load;
  truck?: Truck;
  trackingEvents: TrackingEvent[];
}

export interface UserWithCompliance extends User {
  documents: ComplianceDocument[];
}

/**
 * Example:
 *
 * import mockData from "../data/tamp-mock-data-za.json";
 * import type { TampDatabase } from "../types/tamp";
 *
 * const db: TampDatabase = mockData;
 *
 * Requires `resolveJsonModule: true` in tsconfig.json.
 */
