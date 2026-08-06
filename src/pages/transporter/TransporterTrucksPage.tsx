import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/transporter-css/TransporterTrucksPage.css";
import { getCurrentSession } from "../../services/authService";
import { getTrucksByTransporter } from "../../services/mockDb";
import { setTransporterTruckAvailability } from "../../services/transporterTruckService";
import { ROUTES } from "../../routes/paths";
import type { TruckStatus } from "../../types/tamp";

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 1,
});

const statusLabels: Record<TruckStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  in_transit: "In transit",
  unavailable: "Unavailable",
};

type StatusFilter = "all" | TruckStatus;

type NavigationState = {
  message?: string;
};

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatTonnes(capacityKg: number) {
  return `${numberFormatter.format(capacityKg / 1_000)} t`;
}

export function TransporterTrucksPage() {
  const session = getCurrentSession();
  const location = useLocation();
  const navigationState = location.state as NavigationState | null;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(
    navigationState?.message ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  if (!session || session.role !== "transporter") {
    return (
      <section className="transporter-trucks transporter-trucks--state">
        <div className="transporter-trucks__state-card" role="alert">
          <p className="transporter-trucks__eyebrow">Fleet management</p>
          <h1>Transporter session required</h1>
          <p>
            Sign in with a Transporter account to manage truck availability.
          </p>
        </div>
      </section>
    );
  }

  const trucks = getTrucksByTransporter(session.id).sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTrucks = trucks.filter((truck) => {
    const matchesStatus =
      statusFilter === "all" || truck.status === statusFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      truck.displayName.toLowerCase().includes(normalizedQuery) ||
      truck.registrationDisplay.toLowerCase().includes(normalizedQuery) ||
      truck.currentLocation.city.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });

  const availableCount = trucks.filter(
    (truck) => truck.status === "available",
  ).length;
  const activeCount = trucks.filter(
    (truck) => truck.status === "reserved" || truck.status === "in_transit",
  ).length;

  const handleAvailabilityChange = (
    truckId: string,
    nextStatus: "available" | "unavailable",
  ) => {
    setError(null);
    setNotice(null);

    try {
      setTransporterTruckAvailability(session.id, truckId, nextStatus);
      setNotice(
        nextStatus === "available"
          ? "Truck is now available for matching."
          : "Truck has been marked unavailable.",
      );
      forceRefresh((value) => value + 1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update truck availability.",
      );
    }
  };

  return (
    <section
      className="transporter-trucks"
      aria-labelledby="transporter-trucks-heading"
    >
      <header className="transporter-trucks__header">
        <div>
          <p className="transporter-trucks__eyebrow">Fleet management</p>
          <h1 id="transporter-trucks-heading">My trucks</h1>
          <p>
            Keep capacity, location and availability accurate so suitable loads
            can be matched.
          </p>
        </div>
        <Link
          className="transporter-trucks__primary-action"
          to={ROUTES.transporterNewTruck}
        >
          Add truck
        </Link>
      </header>

      {notice ? (
        <div
          className="transporter-trucks__feedback transporter-trucks__feedback--success"
          role="status"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          className="transporter-trucks__feedback transporter-trucks__feedback--error"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      ) : null}

      <section
        className="transporter-trucks__summary"
        aria-label="Fleet summary"
      >
        <article>
          <span>Total trucks</span>
          <strong>{trucks.length}</strong>
        </article>
        <article>
          <span>Available</span>
          <strong>{availableCount}</strong>
        </article>
        <article>
          <span>Reserved or moving</span>
          <strong>{activeCount}</strong>
        </article>
      </section>

      <section
        className="transporter-trucks__toolbar"
        aria-label="Truck filters"
      >
        <label>
          <span>Search fleet</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, registration or city"
          />
        </label>
        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="in_transit">In transit</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
      </section>

      {trucks.length === 0 ? (
        <section className="transporter-trucks__empty">
          <div className="transporter-trucks__empty-icon" aria-hidden="true">
            TRK
          </div>
          <h2>No trucks posted yet</h2>
          <p>
            Add your first vehicle to make its capacity visible for matching.
          </p>
          <Link to={ROUTES.transporterNewTruck}>Add your first truck</Link>
        </section>
      ) : filteredTrucks.length === 0 ? (
        <section className="transporter-trucks__empty">
          <h2>No trucks match these filters</h2>
          <p>Clear the search or choose another status.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
          >
            Clear filters
          </button>
        </section>
      ) : (
        <div className="transporter-trucks__grid">
          {filteredTrucks.map((truck) => {
            const isBookingControlled =
              truck.status === "reserved" || truck.status === "in_transit";

            return (
              <article className="transporter-truck-card" key={truck.id}>
                <div className="transporter-truck-card__heading">
                  <div>
                    <p>{truck.registrationDisplay}</p>
                    <h2>{truck.displayName}</h2>
                  </div>
                  <span
                    className={`transporter-truck-status transporter-truck-status--${truck.status}`}
                  >
                    {statusLabels[truck.status]}
                  </span>
                </div>

                <dl className="transporter-truck-card__details">
                  <div>
                    <dt>Vehicle type</dt>
                    <dd>{truck.vehicleType.replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt>Capacity</dt>
                    <dd>
                      {formatTonnes(truck.capacityKg)} / {truck.capacityM3} m³
                    </dd>
                  </div>
                  <div>
                    <dt>Current location</dt>
                    <dd>
                      {truck.currentLocation.city},{" "}
                      {truck.currentLocation.province}
                    </dd>
                  </div>
                  <div>
                    <dt>Available from</dt>
                    <dd>{formatDateTime(truck.availabilityWindow.start)}</dd>
                  </div>
                  <div>
                    <dt>Available until</dt>
                    <dd>{formatDateTime(truck.availabilityWindow.end)}</dd>
                  </div>
                </dl>

                <div className="transporter-truck-card__actions">
                  {isBookingControlled ? (
                    <span className="transporter-truck-card__locked">
                      Availability is controlled by the active booking.
                    </span>
                  ) : (
                    <label>
                      <span>Availability</span>
                      <select
                        value={truck.status}
                        onChange={(event) =>
                          handleAvailabilityChange(
                            truck.id,
                            event.target.value as "available" | "unavailable",
                          )
                        }
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </label>
                  )}

                  {isBookingControlled ? (
                    <span
                      className="transporter-truck-card__edit-disabled"
                      aria-disabled="true"
                    >
                      Edit locked
                    </span>
                  ) : (
                    <Link to={`${ROUTES.transporterTrucks}/${truck.id}/edit`}>
                      Edit truck
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
