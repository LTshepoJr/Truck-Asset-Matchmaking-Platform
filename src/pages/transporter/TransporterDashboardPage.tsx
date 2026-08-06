import { Link } from "react-router-dom";
import "../../styles/transporter-css/TransporterDashboardPage.css";
import { getCurrentSession } from "../../services/authService";
import { ROUTES } from "../../routes/paths";
import {
  getAuditEvents,
  getLoadById,
  getMatches,
  getRatingsByReviewer,
  getTransporterKpis,
  getTrips,
  getTrucksByTransporter,
  getUserById,
} from "../../services/mockDb";
import type {
  AuditEvent,
  Load,
  Match,
  Rating,
  Trip,
  TripStatus,
  Truck,
  TruckStatus,
  User,
} from "../../types/tamp";

type DashboardActivityKind = "truck" | "match" | "trip" | "rating";

type DashboardActivity = {
  id: string;
  kind: DashboardActivityKind;
  title: string;
  detail: string;
  timestamp: string;
  sectionId: string;
};

type ResolvedTrip = {
  trip: Trip;
  match: Match;
  load: Load;
  truck: Truck;
  freightOwner: User | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("en-ZA");

const truckStatusLabels: Record<TruckStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  in_transit: "In transit",
  unavailable: "Unavailable",
};

const tripStatusLabels: Record<TripStatus, string> = {
  confirmed: "Confirmed",
  at_pickup: "At pickup",
  loaded: "Loaded",
  in_transit: "In transit",
  at_delivery: "At delivery",
  completed: "Completed",
};

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatKilograms(value: number) {
  return `${numberFormatter.format(value)} kg`;
}

function formatRating(value: number | null) {
  return value === null ? "New" : value.toFixed(1);
}

function formatActivityAge(timestamp: string) {
  const elapsedMilliseconds = Date.now() - new Date(timestamp).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMilliseconds / 60_000));

  if (elapsedMinutes < 1) {
    return "Just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  }

  return formatDate(timestamp);
}

function getFirstName(name: string | undefined) {
  const normalizedName = name?.trim();

  return normalizedName ? normalizedName.split(/\s+/)[0] : "Transporter";
}

function resolveTrips(
  trips: Trip[],
  matchesById: Map<string, Match>,
  trucksById: Map<string, Truck>,
): ResolvedTrip[] {
  return trips.flatMap((trip) => {
    const match = matchesById.get(trip.matchId);
    if (!match) {
      return [];
    }

    const load = getLoadById(match.loadId);
    const truck = trucksById.get(match.truckId);
    if (!load || !truck) {
      return [];
    }

    return [
      {
        trip,
        match,
        load,
        truck,
        freightOwner: getUserById(load.ownerId) ?? null,
      },
    ];
  });
}

function buildTruckActivities(
  events: AuditEvent[],
  trucksById: Map<string, Truck>,
): DashboardActivity[] {
  return events.flatMap((event) => {
    if (event.action !== "TRUCK_POSTED") {
      return [];
    }

    const truck = trucksById.get(event.entityId);
    if (!truck) {
      return [];
    }

    return [
      {
        id: `truck-${event.id}`,
        kind: "truck" as const,
        title: "Truck added to your fleet",
        detail: `${truck.displayName} · ${truck.currentLocation.city}`,
        timestamp: event.timestamp,
        sectionId: "fleet",
      },
    ];
  });
}

function buildMatchActivities(
  matches: Match[],
  trucksById: Map<string, Truck>,
): DashboardActivity[] {
  return matches.flatMap((match) => {
    const load = getLoadById(match.loadId);
    const truck = trucksById.get(match.truckId);
    if (!load || !truck) {
      return [];
    }

    const decisionTitle =
      match.status === "accepted"
        ? "Load match accepted"
        : match.status === "rejected"
          ? "Load match rejected"
          : "New load recommendation";

    return [
      {
        id: `match-${match.id}`,
        kind: "match" as const,
        title: decisionTitle,
        detail: `${load.origin.city} → ${load.destination.city} · ${truck.displayName}`,
        timestamp: match.decision?.timestamp ?? match.createdAt,
        sectionId: "recommended-loads",
      },
    ];
  });
}

function buildTripActivities(
  resolvedTrips: ResolvedTrip[],
): DashboardActivity[] {
  return resolvedTrips.map(({ trip, load }) => ({
    id: `trip-${trip.id}`,
    kind: "trip",
    title:
      trip.status === "completed"
        ? "Trip completed"
        : `Trip ${tripStatusLabels[trip.status].toLowerCase()}`,
    detail: `${load.origin.city} → ${load.destination.city} · ${trip.progressPercent}% complete`,
    timestamp: trip.lastUpdatedAt,
    sectionId: "active-trip",
  }));
}

function buildRatingActivities(ratings: Rating[]): DashboardActivity[] {
  return ratings.map((rating) => {
    const reviewedUser = getUserById(rating.reviewedUserId);

    return {
      id: `rating-${rating.id}`,
      kind: "rating",
      title: "Freight owner rated",
      detail: `${rating.score}/5${reviewedUser ? ` · ${reviewedUser.name}` : ""}`,
      timestamp: rating.timestamp,
      sectionId: "recent-activity",
    };
  });
}

export function TransporterDashboardPage() {
  const session = getCurrentSession();

  if (!session || session.role !== "transporter") {
    return (
      <section className="transporter-dashboard transporter-dashboard--state">
        <div className="transporter-dashboard__state-card" role="alert">
          <p className="transporter-dashboard__eyebrow">
            Transporter workspace
          </p>
          <h2>Transporter session required</h2>
          <p>
            Sign in with a transporter account to view fleet and load activity.
          </p>
        </div>
      </section>
    );
  }

  const transporter = getUserById(session.id);
  const trucks = getTrucksByTransporter(session.id).sort((left, right) => {
    const statusPriority: Record<TruckStatus, number> = {
      available: 0,
      reserved: 1,
      in_transit: 2,
      unavailable: 3,
    };

    return (
      statusPriority[left.status] - statusPriority[right.status] ||
      left.displayName.localeCompare(right.displayName)
    );
  });
  const trucksById = new Map(trucks.map((truck) => [truck.id, truck]));
  const truckIds = new Set(trucksById.keys());

  const matches = getMatches()
    .filter((match) => truckIds.has(match.truckId))
    .sort(
      (left, right) =>
        new Date(right.decision?.timestamp ?? right.createdAt).getTime() -
        new Date(left.decision?.timestamp ?? left.createdAt).getTime(),
    );
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const matchIds = new Set(matchesById.keys());

  const trips = getTrips()
    .filter((trip) => matchIds.has(trip.matchId))
    .sort(
      (left, right) =>
        new Date(right.lastUpdatedAt).getTime() -
        new Date(left.lastUpdatedAt).getTime(),
    );
  const resolvedTrips = resolveTrips(trips, matchesById, trucksById);
  const activeTrip =
    resolvedTrips.find(({ trip }) => trip.status !== "completed") ?? null;

  const recommendedMatches = matches
    .filter((match) => match.eligible && match.status === "recommended")
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const ratingsByTransporter = getRatingsByReviewer(session.id);
  const ratedTripIds = new Set(
    ratingsByTransporter.map((rating) => rating.tripId),
  );
  const pendingReviews = resolvedTrips.filter(
    ({ trip }) => trip.status === "completed" && !ratedTripIds.has(trip.id),
  ).length;

  const transporterAuditEvents = getAuditEvents().filter(
    (event) => event.actorId === session.id,
  );
  const recentActivity = [
    ...buildTruckActivities(transporterAuditEvents, trucksById),
    ...buildMatchActivities(matches, trucksById),
    ...buildTripActivities(resolvedTrips),
    ...buildRatingActivities(ratingsByTransporter),
  ]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() -
        new Date(left.timestamp).getTime(),
    )
    .slice(0, 6);

  const kpis = getTransporterKpis(session.id);
  const verificationStatus = transporter?.verificationStatus ?? "pending";
  const complianceStatus = transporter?.complianceStatus ?? "pending";
  const dashboardName = transporter?.name;

  return (
    <section className="transporter-dashboard">
      <section
        className="transporter-dashboard__hero"
        aria-labelledby="transporter-heading"
      >
        <div>
          <p className="transporter-dashboard__eyebrow">
            Transporter workspace
          </p>
          <h1 id="transporter-heading">
            Welcome back, {getFirstName(dashboardName)}
          </h1>
          <p className="transporter-dashboard__hero-copy">
            Keep your fleet visible, review suitable cargo and monitor accepted
            trips from one dashboard.
          </p>
        </div>

        <div className="transporter-dashboard__hero-actions">
          <div
            className="transporter-dashboard__account-status"
            aria-label="Account status"
          >
            <span className={`status-pill status-pill--${verificationStatus}`}>
              Verification: {verificationStatus}
            </span>
            <span className={`status-pill status-pill--${complianceStatus}`}>
              Compliance: {complianceStatus}
            </span>
          </div>
          <a
            className="transporter-dashboard__primary-action"
            href="#recommended-loads"
          >
            Review recommended loads
          </a>
        </div>
      </section>

      <section
        className="transporter-dashboard__kpis"
        aria-label="Transporter summary"
      >
        <article className="transporter-kpi-card">
          <span className="transporter-kpi-card__label">Total trucks</span>
          <strong>{kpis.totalTrucks}</strong>
          <span>Registered fleet</span>
        </article>
        <article className="transporter-kpi-card">
          <span className="transporter-kpi-card__label">Available now</span>
          <strong>{kpis.availableTrucks}</strong>
          <span>Ready for matching</span>
        </article>
        <article className="transporter-kpi-card">
          <span className="transporter-kpi-card__label">Recommended loads</span>
          <strong>{kpis.recommendedLoads}</strong>
          <span>Awaiting a decision</span>
        </article>
        <article className="transporter-kpi-card">
          <span className="transporter-kpi-card__label">Active trips</span>
          <strong>{kpis.activeTrips}</strong>
          <span>Confirmed or moving</span>
        </article>
        <article className="transporter-kpi-card transporter-kpi-card--rating">
          <span className="transporter-kpi-card__label">
            Transporter rating
          </span>
          <strong>{formatRating(kpis.averageRating)}</strong>
          <span>
            {pendingReviews} review{pendingReviews === 1 ? "" : "s"} pending
          </span>
        </article>
      </section>

      <section
        className="transporter-dashboard__quick-actions"
        aria-labelledby="quick-actions-heading"
      >
        <div className="transporter-dashboard__section-heading">
          <div>
            <p className="transporter-dashboard__eyebrow">Quick actions</p>
            <h2 id="quick-actions-heading">Move work forward</h2>
          </div>
        </div>

        <div className="transporter-dashboard__action-grid">
          <Link
            className="transporter-action-card"
            to={ROUTES.transporterTrucks}
          >
            <span className="transporter-action-card__icon" aria-hidden="true">
              01
            </span>
            <span>
              <strong>Manage fleet</strong>
              <small>Review truck availability, capacity and location.</small>
            </span>
          </Link>
          <a className="transporter-action-card" href="#recommended-loads">
            <span className="transporter-action-card__icon" aria-hidden="true">
              02
            </span>
            <span>
              <strong>Review matches</strong>
              <small>Compare compatible loads ranked by match score.</small>
            </span>
          </a>
          <a className="transporter-action-card" href="#active-trip">
            <span className="transporter-action-card__icon" aria-hidden="true">
              03
            </span>
            <span>
              <strong>Track current trip</strong>
              <small>See route progress and the latest trip status.</small>
            </span>
          </a>
          <a className="transporter-action-card" href="#recent-activity">
            <span className="transporter-action-card__icon" aria-hidden="true">
              04
            </span>
            <span>
              <strong>Check activity</strong>
              <small>Review recent fleet, match and trip events.</small>
            </span>
          </a>
        </div>
      </section>

      <div className="transporter-dashboard__content-grid">
        <section
          className="transporter-panel transporter-panel--fleet"
          id="fleet"
          aria-labelledby="fleet-heading"
        >
          <div className="transporter-dashboard__section-heading">
            <div>
              <p className="transporter-dashboard__eyebrow">Fleet overview</p>
              <h2 id="fleet-heading">Your trucks</h2>
            </div>
            <Link
              className="transporter-dashboard__section-count"
              to={ROUTES.transporterTrucks}
            >
              View all {trucks.length} vehicle{trucks.length === 1 ? "" : "s"}
            </Link>
          </div>

          {trucks.length === 0 ? (
            <div className="transporter-empty-state">
              <h3>No trucks posted yet</h3>
              <p>Add a truck to make capacity visible to freight owners.</p>
              <Link
                className="transporter-empty-state__action"
                to={ROUTES.transporterNewTruck}
              >
                Add truck
              </Link>
            </div>
          ) : (
            <div className="transporter-fleet-list">
              {trucks.slice(0, 4).map((truck) => (
                <article className="transporter-fleet-card" key={truck.id}>
                  <div className="transporter-fleet-card__heading">
                    <div>
                      <h3>{truck.displayName}</h3>
                      <p>{truck.registrationDisplay}</p>
                    </div>
                    <span
                      className={`truck-status truck-status--${truck.status}`}
                    >
                      {truckStatusLabels[truck.status]}
                    </span>
                  </div>
                  <dl className="transporter-fleet-card__details">
                    <div>
                      <dt>Location</dt>
                      <dd>{truck.currentLocation.city}</dd>
                    </div>
                    <div>
                      <dt>Capacity</dt>
                      <dd>{formatKilograms(truck.capacityKg)}</dd>
                    </div>
                    <div>
                      <dt>Available</dt>
                      <dd>
                        {formatDate(truck.availabilityWindow.start)} –{" "}
                        {formatDate(truck.availabilityWindow.end)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          className="transporter-panel transporter-panel--matches"
          id="recommended-loads"
          aria-labelledby="recommended-loads-heading"
        >
          <div className="transporter-dashboard__section-heading">
            <div>
              <p className="transporter-dashboard__eyebrow">
                Match recommendations
              </p>
              <h2 id="recommended-loads-heading">Suitable loads</h2>
            </div>
            <span className="transporter-dashboard__section-count">
              {recommendedMatches.length} shown
            </span>
          </div>

          {recommendedMatches.length === 0 ? (
            <div className="transporter-empty-state">
              <h3>No recommended loads right now</h3>
              <p>
                Available trucks will appear here when a compatible load is
                found.
              </p>
            </div>
          ) : (
            <div className="transporter-match-list">
              {recommendedMatches.map((match) => {
                const load = getLoadById(match.loadId);
                const truck = trucksById.get(match.truckId);

                if (!load || !truck) {
                  return null;
                }

                return (
                  <article className="transporter-match-card" key={match.id}>
                    <div
                      className="transporter-match-card__score"
                      aria-label={`${match.score}% match`}
                    >
                      <strong>{match.score}%</strong>
                      <span>match</span>
                    </div>
                    <div className="transporter-match-card__body">
                      <div className="transporter-match-card__route">
                        <h3>
                          {load.origin.city} → {load.destination.city}
                        </h3>
                        <span>{load.cargoType}</span>
                      </div>
                      <dl className="transporter-match-card__details">
                        <div>
                          <dt>Load</dt>
                          <dd>{formatKilograms(load.weightKg)}</dd>
                        </div>
                        <div>
                          <dt>Truck</dt>
                          <dd>{truck.displayName}</dd>
                        </div>
                        <div>
                          <dt>Pickup</dt>
                          <dd>{formatDate(load.pickupWindow.start)}</dd>
                        </div>
                      </dl>
                      <p className="transporter-match-card__reason">
                        {match.reasons[0] ??
                          "Capacity, location and availability are compatible."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="transporter-dashboard__content-grid transporter-dashboard__content-grid--lower">
        <section
          className="transporter-panel transporter-panel--trip"
          id="active-trip"
          aria-labelledby="active-trip-heading"
        >
          <div className="transporter-dashboard__section-heading">
            <div>
              <p className="transporter-dashboard__eyebrow">Trip tracking</p>
              <h2 id="active-trip-heading">Active trip</h2>
            </div>
          </div>

          {!activeTrip ? (
            <div className="transporter-empty-state transporter-empty-state--trip">
              <h3>No active trip</h3>
              <p>
                An accepted match will appear here with mock route progress.
              </p>
            </div>
          ) : (
            <article className="transporter-trip-card">
              <div className="transporter-trip-card__header">
                <div>
                  <span className="transporter-trip-card__contract">
                    Contract {activeTrip.trip.contractId}
                  </span>
                  <h3>
                    {activeTrip.load.origin.city} →{" "}
                    {activeTrip.load.destination.city}
                  </h3>
                  <p>
                    {activeTrip.truck.displayName}
                    {activeTrip.freightOwner
                      ? ` · ${activeTrip.freightOwner.company}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`trip-status trip-status--${activeTrip.trip.status}`}
                >
                  {tripStatusLabels[activeTrip.trip.status]}
                </span>
              </div>

              <div className="transporter-trip-card__progress-heading">
                <span>Route progress</span>
                <strong>{activeTrip.trip.progressPercent}%</strong>
              </div>
              <div
                className="transporter-trip-card__progress"
                role="progressbar"
                aria-label="Trip progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={activeTrip.trip.progressPercent}
              >
                <span
                  style={{ width: `${activeTrip.trip.progressPercent}%` }}
                />
              </div>

              <div className="transporter-trip-card__route-points">
                <div>
                  <span aria-hidden="true" />
                  <small>Origin</small>
                  <strong>{activeTrip.trip.origin}</strong>
                </div>
                <div>
                  <span aria-hidden="true" />
                  <small>Destination</small>
                  <strong>{activeTrip.trip.destination}</strong>
                </div>
              </div>

              <p className="transporter-trip-card__updated">
                Last updated {formatDateTime(activeTrip.trip.lastUpdatedAt)}
              </p>
            </article>
          )}
        </section>

        <section
          className="transporter-panel transporter-panel--activity"
          id="recent-activity"
          aria-labelledby="recent-activity-heading"
        >
          <div className="transporter-dashboard__section-heading">
            <div>
              <p className="transporter-dashboard__eyebrow">Audit trail</p>
              <h2 id="recent-activity-heading">Recent activity</h2>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="transporter-empty-state">
              <h3>No recent activity</h3>
              <p>Fleet, match and trip updates will be recorded here.</p>
            </div>
          ) : (
            <ol className="transporter-activity-list">
              {recentActivity.map((activity) => (
                <li key={activity.id}>
                  <a href={`#${activity.sectionId}`}>
                    <span
                      className={`transporter-activity-list__marker transporter-activity-list__marker--${activity.kind}`}
                      aria-hidden="true"
                    />
                    <span className="transporter-activity-list__body">
                      <strong>{activity.title}</strong>
                      <small>{activity.detail}</small>
                    </span>
                    <time dateTime={activity.timestamp}>
                      {formatActivityAge(activity.timestamp)}
                    </time>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}
