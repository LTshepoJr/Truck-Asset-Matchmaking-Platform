import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import "../../styles/freight-owner-css/FreightOwnerLoadsPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import { getLoadsByOwner, getVehicleTypes } from "../../services/mockDb";

import type { Load, LoadStatus } from "../../types/tamp";

type StatusFilter = LoadStatus | "all";

type SortOption = "newest" | "oldest" | "pickup-soonest";
const STATUS_LABELS: Record<LoadStatus, string> = {
  draft: "Draft",
  open: "Open",
  matched: "Matched",
  in_transit: "In transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}
function getStatusClass(status: LoadStatus): string {
  return `freight-loads-page__status freight-loads-page__status--${status.replace(
    "_",
    "-",
  )}`;
}

export function FreightOwnerLoadsPage() {
  const session = getCurrentSession();

  const loads = useMemo(() => {
    if (!session || session.role !== "freight-owner") {
      return [];
    }

    return getLoadsByOwner(session.id);
  }, [session]);

  const vehicleTypes = useMemo(() => getVehicleTypes(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const vehicleLabels = useMemo(
    () =>
      new Map(
        vehicleTypes.map((vehicleType) => [vehicleType.id, vehicleType.label]),
      ),
    [vehicleTypes],
  );

  const summary = useMemo(
    () => ({
      total: loads.length,

      open: loads.filter((load) => load.status === "open").length,
      active: loads.filter(
        (load) => load.status === "matched" || load.status === "in_transit",
      ).length,

      completed: loads.filter((load) => load.status === "completed").length,
    }),
    [loads],
  );

  const filteredLoads = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = loads.filter((load) => {
      const matchesStatus =
        statusFilter === "all" || load.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        load.id.toLowerCase().includes(normalizedSearch) ||
        load.origin.city.toLowerCase().includes(normalizedSearch) ||
        load.destination.city.toLowerCase().includes(normalizedSearch) ||
        load.cargoType.toLowerCase().includes(normalizedSearch) ||
        load.description.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
    return [...result].sort((a, b) => {
      if (sortOption === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      if (sortOption === "pickup-soonest") {
        return (
          new Date(a.pickupWindow.start).getTime() -
          new Date(b.pickupWindow.start).getTime()
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [loads, searchTerm, sortOption, statusFilter]);

  if (!session || session.role !== "freight-owner") {
    return (
      <section className="freight-loads-page">
        <div className="freight-loads-page__alert" role="alert">
          Your Freight Owner session could not be found. Please sign in again.
        </div>
      </section>
    );
  }
  return (
    <section className="freight-loads-page">
      <header className="freight-loads-page__header">
        <div>
          <h2>My Loads</h2>

          <p>View and manage the cargo loads posted by your organization.</p>
        </div>

        <Link
          className="freight-loads-page__primary-action"
          to={ROUTES.freightOwnerNewLoad}
        >
          Post new load
        </Link>
      </header>
      {loads.length > 0 && (
        <div className="freight-loads-page__summary" aria-label="Load summary">
          <article className="freight-loads-page__summary-card">
            <span>Total loads</span>
            <strong>{summary.total}</strong>
          </article>

          <article className="freight-loads-page__summary-card">
            <span>Open</span>
            <strong>{summary.open}</strong>
          </article>
          <article className="freight-loads-page__summary-card">
            <span>Active</span>
            <strong>{summary.active}</strong>
          </article>

          <article className="freight-loads-page__summary-card">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </article>
        </div>
      )}
      {loads.length === 0 ? (
        <div className="freight-loads-page__empty">
          <div className="freight-loads-page__empty-icon" aria-hidden="true">
            +
          </div>

          <h3>No loads posted yet</h3>

          <p>
            Once you post your first cargo load, it will appear here together
            with its route, pickup window and current status.
          </p>
          <Link
            className="freight-loads-page__primary-action"
            to={ROUTES.freightOwnerNewLoad}
          >
            Post your first load
          </Link>
        </div>
      ) : (
        <>
          <div className="freight-loads-page__toolbar">
            <div className="freight-loads-page__search">
              <label htmlFor="load-search">Search loads</label>
              <input
                id="load-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search ID, route or cargo..."
              />
            </div>

            <div className="freight-loads-page__filter">
              <label htmlFor="load-status">Status</label>
              <select
                id="load-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="in_transit">In transit</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="freight-loads-page__filter">
              <label htmlFor="load-sort">Sort by</label>
              <select
                id="load-sort"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                <option value="newest">Newest first</option>

                <option value="oldest">Oldest first</option>

                <option value="pickup-soonest">Pickup soonest</option>
              </select>
            </div>
          </div>
          <div className="freight-loads-page__results-heading">
            <p>
              <strong>{filteredLoads.length}</strong>{" "}
              {filteredLoads.length === 1 ? "load" : "loads"}
            </p>
          </div>

          {filteredLoads.length === 0 ? (
            <div className="freight-loads-page__no-results">
              <h3>No matching loads</h3>

              <p>Try changing your search term or status filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSortOption("newest");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="freight-loads-page__list">
              {filteredLoads.map((load) => (
                <LoadCard
                  key={load.id}
                  load={load}
                  vehicleLabel={
                    vehicleLabels.get(load.requiredVehicleType) ??
                    load.requiredVehicleType
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
interface LoadCardProps {
  load: Load;
  vehicleLabel: string;
}

function LoadCard({ load, vehicleLabel }: LoadCardProps) {
  return (
    <article className="freight-loads-page__card">
      <div className="freight-loads-page__card-header">
        <div>
          <div className="freight-loads-page__load-identity">
            <h3>{load.id}</h3>

            <span className={getStatusClass(load.status)}>
              {STATUS_LABELS[load.status]}
            </span>
          </div>
          <p className="freight-loads-page__created">
            Posted {formatDateTime(load.createdAt)}
          </p>
        </div>
      </div>

      <div className="freight-loads-page__route">
        <div className="freight-loads-page__route-location">
          <span>Origin</span>
          <strong>{load.origin.city}</strong>
          <small>{load.origin.province}</small>
        </div>
        <div className="freight-loads-page__route-line" aria-hidden="true">
          <span />
          <div />
          <span />
        </div>

        <div className="freight-loads-page__route-location freight-loads-page__route-location--destination">
          <span>Destination</span>
          <strong>{load.destination.city}</strong>
          <small>{load.destination.province}</small>
        </div>
      </div>
      <div className="freight-loads-page__details">
        <div>
          <span>Cargo</span>
          <strong>{load.cargoType}</strong>
        </div>

        <div>
          <span>Weight</span>
          <strong>
            {(load.weightKg / 1_000).toLocaleString("en-ZA", {
              maximumFractionDigits: 2,
            })}{" "}
            tonnes
          </strong>
        </div>

        <div>
          <span>Volume</span>
          <strong>{load.volumeM3} m³</strong>
        </div>

        <div>
          <span>Vehicle</span>
          <strong>{vehicleLabel}</strong>
        </div>
      </div>
      <div className="freight-loads-page__pickup">
        <div>
          <span>Pickup window</span>

          <strong>{formatDateTime(load.pickupWindow.start)}</strong>

          <small>until {formatDateTime(load.pickupWindow.end)}</small>
        </div>
      </div>

      {load.description && (
        <div className="freight-loads-page__description">
          <span>Cargo notes</span>
          <p>{load.description}</p>
        </div>
      )}
    </article>
  );
}
