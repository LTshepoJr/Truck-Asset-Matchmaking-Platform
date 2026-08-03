import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Link, useSearchParams } from "react-router-dom";

import "../../styles/FreightOwnerTrackingPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  advanceTripDemo,
  getLoadById,
  getMatchById,
  getTrackingEvents,
  getTripsByFreightOwner,
  getTruckById,
  getUserById,
  getVehicleTypes,
} from "../../services/mockDb";

import type {
  Load,
  Match,
  TrackingEvent,
  Trip,
  TripStatus,
  Truck,
} from "../../types/tamp";

const TRIP_STEPS: TripStatus[] = [
  "confirmed",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_delivery",
  "completed",
];

const STATUS_LABELS: Record<TripStatus, string> = {
  confirmed: "Confirmed",
  at_pickup: "At pickup",
  loaded: "Loaded",
  in_transit: "In transit",
  at_delivery: "At delivery",
  completed: "Completed",
};

interface TripDetails {
  trip: Trip;
  match: Match;
  load: Load;
  truck: Truck;
  transporterName: string;
  vehicleLabel: string;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

function sortTrips(trips: Trip[]): Trip[] {
  return [...trips].sort(
    (a, b) =>
      new Date(b.lastUpdatedAt).getTime() -
      new Date(a.lastUpdatedAt).getTime(),
  );
}

function getNextStatus(status: TripStatus): TripStatus | null {
  const currentIndex = TRIP_STEPS.indexOf(status);

  if (
    currentIndex === -1 ||
    currentIndex === TRIP_STEPS.length - 1
  ) {
    return null;
  }

  return TRIP_STEPS[currentIndex + 1];
}

export function FreightOwnerTrackingPage() {
  const session = getCurrentSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const sessionId = session?.id;
  const sessionRole = session?.role;

  const [trips, setTrips] = useState<Trip[]>(() => {
    if (!sessionId || sessionRole !== "freight-owner") {
      return [];
    }

    return sortTrips(getTripsByFreightOwner(sessionId));
  });

  const requestedTripId = searchParams.get("tripId");

  const initialTripId =
    trips.find((trip) => trip.id === requestedTripId)?.id ??
    trips.find((trip) => trip.status !== "completed")?.id ??
    trips[0]?.id ??
    "";

  const [selectedTripId, setSelectedTripId] =
    useState(initialTripId);

  const [trackingEvents, setTrackingEvents] =
    useState<TrackingEvent[]>(() =>
      initialTripId ? getTrackingEvents(initialTripId) : [],
    );

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const vehicleLabels = useMemo(
    () =>
      new Map(
        getVehicleTypes().map((vehicleType) => [
          vehicleType.id,
          vehicleType.label,
        ]),
      ),
    [],
  );

  const tripDetails = useMemo<TripDetails | null>(() => {
    const trip = trips.find((item) => item.id === selectedTripId);

    if (!trip) {
      return null;
    }

    const match = getMatchById(trip.matchId);

    if (!match) {
      return null;
    }

    const load = getLoadById(match.loadId);
    const truck = getTruckById(match.truckId);

    if (!load || !truck) {
      return null;
    }

    const transporter = getUserById(truck.transporterId);

    return {
      trip,
      match,
      load,
      truck,
      transporterName:
        transporter?.company ?? transporter?.name ?? "Transporter",
      vehicleLabel:
        vehicleLabels.get(truck.vehicleType) ?? truck.vehicleType,
    };
  }, [selectedTripId, trips, vehicleLabels]);

  const completedEvents = trackingEvents.filter(
    (event) => !event.demoFutureEvent,
  );

  const plannedEvents = trackingEvents.filter(
    (event) => event.demoFutureEvent,
  );

  const currentEvent = completedEvents[completedEvents.length - 1];

  const currentLocation = tripDetails
    ? {
        lat: currentEvent?.lat ?? tripDetails.load.origin.lat,
        lng: currentEvent?.lng ?? tripDetails.load.origin.lng,
        label:
          currentEvent?.label ??
          `${tripDetails.load.origin.city} — awaiting first tracking update`,
      }
    : null;

  const nextStatus = tripDetails
    ? getNextStatus(tripDetails.trip.status)
    : null;

  const refreshTripData = (tripId: string) => {
    if (sessionId && sessionRole === "freight-owner") {
      setTrips(sortTrips(getTripsByFreightOwner(sessionId)));
    }

    setTrackingEvents(getTrackingEvents(tripId));
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    setTrackingEvents(tripId ? getTrackingEvents(tripId) : []);
    setError("");
    setNotice("");

    if (tripId) {
      setSearchParams({ tripId });
    } else {
      setSearchParams({});
    }
  };

  const handleAdvanceDemo = () => {
    if (!tripDetails || !sessionId || !nextStatus) {
      return;
    }

    setIsAdvancing(true);
    setError("");
    setNotice("");

    try {
      const event = advanceTripDemo(tripDetails.trip.id, sessionId);

      refreshTripData(tripDetails.trip.id);

      setNotice(
        `Demo tracking update saved: ${STATUS_LABELS[event.status]}.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to advance the demo trip.",
      );
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!session || session.role !== "freight-owner") {
    return (
      <section className="freight-tracking-page">
        <div className="freight-tracking-page__alert" role="alert">
          Your Freight Owner session could not be found. Please sign in again.
        </div>
      </section>
    );
  }

  return (
    <section className="freight-tracking-page">
      <header className="freight-tracking-page__header">
        <div>
          <h2>Trip Tracking</h2>

          <p>
            Monitor accepted deliveries using simulated route coordinates and
            status progression.
          </p>
        </div>

        <Link
          className="freight-tracking-page__secondary-action"
          to={ROUTES.freightOwnerLoads}
        >
          Back to my loads
        </Link>
      </header>

      {error && (
        <div className="freight-tracking-page__alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div
          className="freight-tracking-page__alert freight-tracking-page__alert--success"
          role="status"
        >
          {notice}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="freight-tracking-page__empty">
          <h3>No trips available to track</h3>

          <p>
            A trip is created after an eligible truck match has been accepted.
          </p>

          <Link
            className="freight-tracking-page__primary-action"
            to={ROUTES.freightOwnerMatches}
          >
            Review matches
          </Link>
        </div>
      ) : (
        <>
          <section className="freight-tracking-page__controls">
            <div className="freight-tracking-page__field">
              <label htmlFor="tracking-trip">Delivery</label>

              <select
                id="tracking-trip"
                value={selectedTripId}
                onChange={(event) => handleTripChange(event.target.value)}
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.id} — {trip.origin} to {trip.destination} —{" "}
                    {STATUS_LABELS[trip.status]}
                  </option>
                ))}
              </select>
            </div>

            {tripDetails && nextStatus && (
              <button
                type="button"
                onClick={handleAdvanceDemo}
                disabled={isAdvancing}
              >
                {isAdvancing
                  ? "Saving update..."
                  : `Simulate ${STATUS_LABELS[nextStatus]}`}
              </button>
            )}
          </section>

          {tripDetails ? (
            <>
              <TripSummary details={tripDetails} />

              <TripProgress
                status={tripDetails.trip.status}
                progress={tripDetails.trip.progressPercent}
              />

              <div className="freight-tracking-page__grid">
                <RoutePanel
                  details={tripDetails}
                  currentLocation={currentLocation}
                />

                <TripInformation
                  details={tripDetails}
                  currentLocation={currentLocation}
                />
              </div>

              <TrackingTimeline
                events={completedEvents}
                plannedEvents={plannedEvents}
                originCity={tripDetails.load.origin.city}
              />

              <div className="freight-tracking-page__demo-note">
                <div>
                  <strong>Frontend demo control</strong>

                  <p>
                    The simulation button represents transporter or telematics
                    updates. In production, a Freight Owner would view these
                    updates rather than create them.
                  </p>
                </div>

                <Link
                  to={`${ROUTES.freightOwnerReceipts}/${encodeURIComponent(
                    tripDetails.match.id,
                  )}`}
                >
                  View confirmation receipt
                </Link>
              </div>
            </>
          ) : (
            <div className="freight-tracking-page__empty">
              <h3>Trip data is incomplete</h3>

              <p>
                The selected trip could not be connected to its match, load or
                truck.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function TripSummary({ details }: { details: TripDetails }) {
  const { trip, load } = details;

  return (
    <article className="freight-tracking-page__summary">
      <div>
        <span>Trip</span>
        <strong>{trip.id}</strong>
      </div>

      <div>
        <span>Contract</span>
        <strong>{trip.contractId}</strong>
      </div>

      <div>
        <span>Route</span>
        <strong>
          {load.origin.city} → {load.destination.city}
        </strong>
      </div>

      <div>
        <span>Status</span>
        <strong className="freight-tracking-page__status">
          {STATUS_LABELS[trip.status]}
        </strong>
      </div>

      <div>
        <span>Last updated</span>
        <strong>{formatDateTime(trip.lastUpdatedAt)}</strong>
      </div>
    </article>
  );
}

function TripProgress({
  status,
  progress,
}: {
  status: TripStatus;
  progress: number;
}) {
  const currentIndex = TRIP_STEPS.indexOf(status);

  return (
    <section
      className="freight-tracking-page__progress-card"
      aria-labelledby="trip-progress-title"
    >
      <div className="freight-tracking-page__progress-heading">
        <div>
          <h3 id="trip-progress-title">Delivery progress</h3>

          <p>
            {STATUS_LABELS[status]} · {progress}%
          </p>
        </div>

        <strong>{progress}%</strong>
      </div>

      <div
        className="freight-tracking-page__progress-bar"
        role="progressbar"
        aria-label="Delivery progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="freight-tracking-page__steps">
        {TRIP_STEPS.map((step, index) => (
          <li
            key={step}
            className={[
              index < currentIndex
                ? "freight-tracking-page__step--complete"
                : "",
              index === currentIndex
                ? "freight-tracking-page__step--current"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span aria-hidden="true">
              {index < currentIndex ? "✓" : index + 1}
            </span>

            <small>{STATUS_LABELS[step]}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RoutePanel({
  details,
  currentLocation,
}: {
  details: TripDetails;
  currentLocation: {
    lat: number;
    lng: number;
    label: string;
  } | null;
}) {
  const progress = Math.min(
    100,
    Math.max(0, details.trip.progressPercent),
  );

  const routeStyle = {
    "--route-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <section className="freight-tracking-page__route-card">
      <div className="freight-tracking-page__card-heading">
        <div>
          <h3>Route illustration</h3>

          <p>Simulated position along the accepted route.</p>
        </div>

        <span>Mock coordinates</span>
      </div>

      <div className="freight-tracking-page__route-map" style={routeStyle}>
        <div className="freight-tracking-page__route-track">
          <span className="freight-tracking-page__route-complete" />

          <span
            className="freight-tracking-page__truck-marker"
            aria-label={`Trip progress ${progress}%`}
          >
            T
          </span>
        </div>

        <div className="freight-tracking-page__route-cities">
          <div>
            <span>Origin</span>
            <strong>{details.load.origin.city}</strong>
            <small>{details.load.origin.province}</small>
          </div>

          <div>
            <span>Destination</span>
            <strong>{details.load.destination.city}</strong>
            <small>{details.load.destination.province}</small>
          </div>
        </div>
      </div>

      {currentLocation && (
        <div className="freight-tracking-page__current-location">
          <div
            className="freight-tracking-page__location-pulse"
            aria-hidden="true"
          />

          <div>
            <span>Latest reported position</span>
            <strong>{currentLocation.label}</strong>
            <small>
              {formatCoordinate(currentLocation.lat)},{" "}
              {formatCoordinate(currentLocation.lng)}
            </small>
          </div>
        </div>
      )}
    </section>
  );
}

function TripInformation({
  details,
  currentLocation,
}: {
  details: TripDetails;
  currentLocation: {
    lat: number;
    lng: number;
    label: string;
  } | null;
}) {
  return (
    <aside className="freight-tracking-page__info-card">
      <div className="freight-tracking-page__card-heading">
        <div>
          <h3>Delivery details</h3>
          <p>Accepted load and truck information.</p>
        </div>
      </div>

      <dl className="freight-tracking-page__details">
        <div>
          <dt>Load</dt>
          <dd>{details.load.id}</dd>
        </div>

        <div>
          <dt>Cargo</dt>
          <dd>{details.load.cargoType}</dd>
        </div>

        <div>
          <dt>Truck</dt>
          <dd>{details.truck.displayName}</dd>
        </div>

        <div>
          <dt>Registration</dt>
          <dd>{details.truck.registrationDisplay}</dd>
        </div>

        <div>
          <dt>Vehicle type</dt>
          <dd>{details.vehicleLabel}</dd>
        </div>

        <div>
          <dt>Transporter</dt>
          <dd>{details.transporterName}</dd>
        </div>

        <div>
          <dt>Current latitude</dt>
          <dd>
            {currentLocation
              ? formatCoordinate(currentLocation.lat)
              : "Unavailable"}
          </dd>
        </div>

        <div>
          <dt>Current longitude</dt>
          <dd>
            {currentLocation
              ? formatCoordinate(currentLocation.lng)
              : "Unavailable"}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function TrackingTimeline({
  events,
  plannedEvents,
  originCity,
}: {
  events: TrackingEvent[];
  plannedEvents: TrackingEvent[];
  originCity: string;
}) {
  return (
    <section className="freight-tracking-page__timeline-card">
      <div className="freight-tracking-page__card-heading">
        <div>
          <h3>Tracking history</h3>

          <p>Recorded mock coordinates and trip status changes.</p>
        </div>

        <span>
          {events.length} update{events.length === 1 ? "" : "s"}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="freight-tracking-page__timeline-empty">
          <strong>Trip confirmed</strong>

          <p>
            The truck is expected at {originCity}. No movement update has been
            recorded yet.
          </p>
        </div>
      ) : (
        <ol className="freight-tracking-page__timeline">
          {[...events].reverse().map((event) => (
            <li key={event.id}>
              <span
                className="freight-tracking-page__timeline-marker"
                aria-hidden="true"
              />

              <div>
                <div className="freight-tracking-page__timeline-heading">
                  <strong>{STATUS_LABELS[event.status]}</strong>

                  <time dateTime={event.timestamp}>
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>

                <p>{event.label}</p>

                <small>
                  {formatCoordinate(event.lat)}, {formatCoordinate(event.lng)} ·{" "}
                  {event.coordinateType === "real_city_reference"
                    ? "City reference"
                    : "Mock route point"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}

      {plannedEvents.length > 0 && (
        <details className="freight-tracking-page__planned">
          <summary>
            Show {plannedEvents.length} planned demo event
            {plannedEvents.length === 1 ? "" : "s"}
          </summary>

          <ul>
            {plannedEvents.map((event) => (
              <li key={event.id}>
                <strong>{STATUS_LABELS[event.status]}</strong>
                <span>{event.label}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
