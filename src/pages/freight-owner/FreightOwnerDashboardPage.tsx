import { Link } from "react-router-dom";

import "../../styles/FreightOwnerDashboardPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  getFreightOwnerKpis,
  getLoadById,
  getLoadsByOwner,
  getMatchById,
  getMatchesForLoad,
  getRatingsByReviewer,
  getTripsByFreightOwner,
  getTruckById,
  getUserById,
} from "../../services/mockDb";

import type {
  Load,
  LoadStatus,
  Match,
  Rating,
  Trip,
  TripStatus,
  Truck,
  User,
} from "../../types/tamp";

const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  draft: "Draft",
  open: "Open",
  matched: "Matched",
  in_transit: "In transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  confirmed: "Confirmed",
  at_pickup: "At pickup",
  loaded: "Loaded",
  in_transit: "In transit",
  at_delivery: "At delivery",
  completed: "Completed",
};

type ActivityKind = "load" | "match" | "trip" | "rating";

interface DashboardActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
  to: string;
}

interface ActiveTripDetails {
  trip: Trip;
  match: Match;
  load: Load;
  truck: Truck;
  transporter: User | undefined;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function getFirstName(name: string | undefined): string {
  const normalizedName = name?.trim();

  if (!normalizedName) {
    return "Freight Owner";
  }

  return normalizedName.split(/\s+/)[0];
}

function getLoadStatusClass(status: LoadStatus): string {
  return `freight-dashboard__status freight-dashboard__status--${status.replace(
    "_",
    "-",
  )}`;
}

function getActivitySymbol(kind: ActivityKind): string {
  const symbols: Record<ActivityKind, string> = {
    load: "L",
    match: "M",
    trip: "T",
    rating: "R",
  };

  return symbols[kind];
}

function buildActivity(
  loads: Load[],
  matches: Match[],
  trips: Trip[],
  ratings: Rating[],
): DashboardActivity[] {
  const activities: DashboardActivity[] = [];

  for (const load of loads) {
    activities.push({
      id: `load-${load.id}`,
      kind: "load",
      title: "Load posted",
      detail: `${load.origin.city} to ${load.destination.city} · ${load.cargoType}`,
      timestamp: load.createdAt,
      to: ROUTES.freightOwnerLoads,
    });
  }

  for (const match of matches) {
    const load = getLoadById(match.loadId);

    if (!load) {
      continue;
    }

    if (match.status === "recommended") {
      activities.push({
        id: `match-created-${match.id}`,
        kind: "match",
        title: "Truck recommendation generated",
        detail: `${match.score}/100 match for ${load.origin.city} to ${load.destination.city}`,
        timestamp: match.createdAt,
        to: ROUTES.freightOwnerMatches,
      });
    }

    if (
      match.decision &&
      match.decision.decision !== "rule_rejected"
    ) {
      const accepted =
        match.decision.decision === "accepted";

      activities.push({
        id: `match-decision-${match.id}`,
        kind: "match",
        title: accepted
          ? "Truck match accepted"
          : "Truck match rejected",
        detail: `${load.origin.city} to ${load.destination.city} · ${match.score}/100`,
        timestamp: match.decision.timestamp,
        to: ROUTES.freightOwnerMatches,
      });
    }
  }

  for (const trip of trips) {
    activities.push({
      id: `trip-${trip.id}-${trip.lastUpdatedAt}`,
      kind: "trip",
      title: `Trip ${TRIP_STATUS_LABELS[
        trip.status
      ].toLowerCase()}`,
      detail: `${trip.origin} to ${trip.destination} · ${trip.progressPercent}% complete`,
      timestamp: trip.lastUpdatedAt,
      to: `${ROUTES.freightOwnerTracking}?tripId=${encodeURIComponent(
        trip.id,
      )}`,
    });
  }

  for (const rating of ratings) {
    const reviewedUser = getUserById(
      rating.reviewedUserId,
    );

    activities.push({
      id: `rating-${rating.id}`,
      kind: "rating",
      title: "Transporter review submitted",
      detail: `${rating.score}/5 for ${
        reviewedUser?.company ?? "the transporter"
      }`,
      timestamp: rating.timestamp,
      to: `${ROUTES.freightOwnerRatings}?tripId=${encodeURIComponent(
        rating.tripId,
      )}`,
    });
  }

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    )
    .slice(0, 6);
}

function resolveActiveTrip(
  trips: Trip[],
): ActiveTripDetails | null {
  for (const trip of trips) {
    if (trip.status === "completed") {
      continue;
    }

    const match = getMatchById(trip.matchId);

    if (!match) {
      continue;
    }

    const load = getLoadById(match.loadId);
    const truck = getTruckById(match.truckId);

    if (!load || !truck) {
      continue;
    }

    return {
      trip,
      match,
      load,
      truck,
      transporter: getUserById(
        truck.transporterId,
      ),
    };
  }

  return null;
}

export function FreightOwnerDashboardPage() {
  const session = getCurrentSession();

  if (
    !session ||
    session.role !== "freight-owner"
  ) {
    return (
      <section className="freight-dashboard">
        <div
          className="freight-dashboard__alert"
          role="alert"
        >
          Your Freight Owner session could not be found.
          Please sign in again.
        </div>
      </section>
    );
  }

  const owner = getUserById(session.id);
  const loads = getLoadsByOwner(session.id).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );

  const matches = loads
    .flatMap((load) => getMatchesForLoad(load.id))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

  const trips = getTripsByFreightOwner(session.id);
  const ratings = getRatingsByReviewer(session.id);
  const kpis = getFreightOwnerKpis(session.id);

  const activeTrips = trips.filter(
    (trip) => trip.status !== "completed",
  );

  const completedTrips = trips.filter(
    (trip) => trip.status === "completed",
  );

  const ratedTripIds = new Set(
    ratings.map((rating) => rating.tripId),
  );

  const pendingReviews = completedTrips.filter(
    (trip) => !ratedTripIds.has(trip.id),
  ).length;

  const recommendedMatches = matches.filter(
    (match) => match.status === "recommended",
  ).length;

  const activeTrip = resolveActiveTrip(trips);
  const recentLoads = loads.slice(0, 4);

  const activities = buildActivity(
    loads,
    matches,
    trips,
    ratings,
  );

  return (
    <section className="freight-dashboard">
      <header className="freight-dashboard__hero">
        <div>
          <p className="freight-dashboard__eyebrow">
            Freight Owner workspace
          </p>

          <h2>
            Welcome back, {getFirstName(owner?.name)}
          </h2>

          <p>
            Monitor your loads, truck recommendations
            and active deliveries from one place.
          </p>
        </div>

        <Link
          className="freight-dashboard__primary-action"
          to={ROUTES.freightOwnerNewLoad}
        >
          <span aria-hidden="true">+</span>
          Post a new load
        </Link>
      </header>

      <section
        className="freight-dashboard__kpis"
        aria-label="Freight Owner performance summary"
      >
        <KpiCard
          label="Total loads"
          value={kpis.totalLoads}
          detail={`${kpis.completedTrips} completed`}
          symbol="L"
        />

        <KpiCard
          label="Open loads"
          value={kpis.openLoads}
          detail={`${recommendedMatches} truck recommendation${
            recommendedMatches === 1 ? "" : "s"
          }`}
          symbol="O"
        />

        <KpiCard
          label="Active deliveries"
          value={activeTrips.length}
          detail={`${kpis.tripsInTransit} currently in transit`}
          symbol="T"
        />

        <KpiCard
          label="Pending reviews"
          value={pendingReviews}
          detail={
            pendingReviews > 0
              ? "Feedback is ready"
              : "All reviews completed"
          }
          symbol="R"
        />
      </section>

      <section
        className="freight-dashboard__quick-actions"
        aria-labelledby="quick-actions-title"
      >
        <div className="freight-dashboard__section-heading">
          <div>
            <p className="freight-dashboard__section-kicker">
              Shortcuts
            </p>
            <h3 id="quick-actions-title">
              Quick actions
            </h3>
          </div>
        </div>

        <div className="freight-dashboard__action-grid">
          <QuickAction
            to={ROUTES.freightOwnerNewLoad}
            symbol="+"
            title="Post load"
            description="Create a cargo requirement and open it for matching."
          />

          <QuickAction
            to={ROUTES.freightOwnerMatches}
            symbol="M"
            title="Review matches"
            description={`${recommendedMatches} recommendation${
              recommendedMatches === 1 ? "" : "s"
            } currently waiting.`}
          />

          <QuickAction
            to={ROUTES.freightOwnerTracking}
            symbol="T"
            title="Track delivery"
            description={`${activeTrips.length} active trip${
              activeTrips.length === 1 ? "" : "s"
            } across your loads.`}
          />

          <QuickAction
            to={ROUTES.freightOwnerRatings}
            symbol="R"
            title="Rate transporter"
            description={`${pendingReviews} completed trip${
              pendingReviews === 1 ? "" : "s"
            } awaiting feedback.`}
          />
        </div>
      </section>

      <div className="freight-dashboard__main-grid">
        <section className="freight-dashboard__panel">
          <div className="freight-dashboard__panel-heading">
            <div>
              <p className="freight-dashboard__section-kicker">
                Operations
              </p>
              <h3>Recent loads</h3>
            </div>

            <Link to={ROUTES.freightOwnerLoads}>
              View all loads
            </Link>
          </div>

          {recentLoads.length === 0 ? (
            <div className="freight-dashboard__empty">
              <strong>No loads posted yet</strong>

              <p>
                Post your first cargo requirement to
                begin matching with available trucks.
              </p>

              <Link
                to={ROUTES.freightOwnerNewLoad}
              >
                Post first load
              </Link>
            </div>
          ) : (
            <div className="freight-dashboard__load-list">
              {recentLoads.map((load) => (
                <article
                  key={load.id}
                  className="freight-dashboard__load-row"
                >
                  <div className="freight-dashboard__load-date">
                    <strong>
                      {formatShortDate(load.createdAt)}
                    </strong>
                    <span>{load.id}</span>
                  </div>

                  <div className="freight-dashboard__load-main">
                    <div className="freight-dashboard__load-title">
                      <strong>
                        {load.origin.city} →{" "}
                        {load.destination.city}
                      </strong>

                      <span
                        className={getLoadStatusClass(
                          load.status,
                        )}
                      >
                        {
                          LOAD_STATUS_LABELS[
                            load.status
                          ]
                        }
                      </span>
                    </div>

                    <p>
                      {load.cargoType} ·{" "}
                      {load.weightKg.toLocaleString(
                        "en-ZA",
                      )}{" "}
                      kg
                    </p>

                    <small>
                      Pickup{" "}
                      {formatDateTime(
                        load.pickupWindow.start,
                      )}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="freight-dashboard__panel">
          <div className="freight-dashboard__panel-heading">
            <div>
              <p className="freight-dashboard__section-kicker">
                Live delivery
              </p>
              <h3>Active trip</h3>
            </div>

            {activeTrip && (
              <Link
                to={`${ROUTES.freightOwnerTracking}?tripId=${encodeURIComponent(
                  activeTrip.trip.id,
                )}`}
              >
                Open tracking
              </Link>
            )}
          </div>

          {activeTrip ? (
            <ActiveTripCard details={activeTrip} />
          ) : (
            <div className="freight-dashboard__empty freight-dashboard__empty--trip">
              <div
                className="freight-dashboard__empty-symbol"
                aria-hidden="true"
              >
                T
              </div>

              <strong>No active delivery</strong>

              <p>
                An active trip will appear here after an
                eligible truck match is accepted.
              </p>

              <Link to={ROUTES.freightOwnerMatches}>
                Review truck matches
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="freight-dashboard__panel freight-dashboard__activity-panel">
        <div className="freight-dashboard__panel-heading">
          <div>
            <p className="freight-dashboard__section-kicker">
              Account history
            </p>
            <h3>Recent activity</h3>
          </div>

          <span>
            {activities.length} recent update
            {activities.length === 1 ? "" : "s"}
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="freight-dashboard__empty">
            <strong>No account activity yet</strong>

            <p>
              Load, match, tracking and rating activity
              will be listed here.
            </p>
          </div>
        ) : (
          <ol className="freight-dashboard__activity-list">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link to={activity.to}>
                  <span
                    className={`freight-dashboard__activity-symbol freight-dashboard__activity-symbol--${activity.kind}`}
                    aria-hidden="true"
                  >
                    {getActivitySymbol(activity.kind)}
                  </span>

                  <span className="freight-dashboard__activity-copy">
                    <strong>{activity.title}</strong>
                    <span>{activity.detail}</span>
                  </span>

                  <time
                    dateTime={activity.timestamp}
                  >
                    {formatDateTime(
                      activity.timestamp,
                    )}
                  </time>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function KpiCard({
  label,
  value,
  detail,
  symbol,
}: {
  label: string;
  value: number;
  detail: string;
  symbol: string;
}) {
  return (
    <article className="freight-dashboard__kpi-card">
      <div className="freight-dashboard__kpi-top">
        <span>{label}</span>

        <span
          className="freight-dashboard__kpi-symbol"
          aria-hidden="true"
        >
          {symbol}
        </span>
      </div>

      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function QuickAction({
  to,
  symbol,
  title,
  description,
}: {
  to: string;
  symbol: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      className="freight-dashboard__quick-action"
      to={to}
    >
      <span
        className="freight-dashboard__quick-action-symbol"
        aria-hidden="true"
      >
        {symbol}
      </span>

      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <span
        className="freight-dashboard__quick-action-arrow"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

function ActiveTripCard({
  details,
}: {
  details: ActiveTripDetails;
}) {
  const { trip, load, truck, transporter } = details;

  return (
    <article className="freight-dashboard__trip-card">
      <div className="freight-dashboard__trip-header">
        <div>
          <span>{trip.id}</span>
          <strong>
            {load.origin.city} →{" "}
            {load.destination.city}
          </strong>
        </div>

        <span className="freight-dashboard__trip-status">
          {TRIP_STATUS_LABELS[trip.status]}
        </span>
      </div>

      <div className="freight-dashboard__trip-progress-copy">
        <span>Delivery progress</span>
        <strong>{trip.progressPercent}%</strong>
      </div>

      <div
        className="freight-dashboard__progress"
        role="progressbar"
        aria-label="Active delivery progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={trip.progressPercent}
      >
        <span
          style={{
            width: `${trip.progressPercent}%`,
          }}
        />
      </div>

      <dl className="freight-dashboard__trip-details">
        <div>
          <dt>Transporter</dt>
          <dd>
            {transporter?.company ?? "Transporter"}
          </dd>
        </div>

        <div>
          <dt>Truck</dt>
          <dd>{truck.displayName}</dd>
        </div>

        <div>
          <dt>Registration</dt>
          <dd>{truck.registrationDisplay}</dd>
        </div>

        <div>
          <dt>Last updated</dt>
          <dd>
            {formatDateTime(trip.lastUpdatedAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
