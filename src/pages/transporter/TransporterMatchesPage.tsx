import { useState } from "react";
import { Link } from "react-router-dom";

import "../../styles/transporter-css/TransporterMatchesPage.css";

import { getCurrentSession } from "../../services/authService";
import {
  acceptMatch,
  getLoadById,
  getMatches,
  getTrucksByTransporter,
  getUserById,
  rejectMatch,
} from "../../services/mockDb";
import { ROUTES } from "../../routes/paths";
import type { Load, Match, MatchStatus, Truck, User } from "../../types/tamp";

type StatusFilter = "all" | MatchStatus;

type ResolvedMatch = {
  match: Match;
  load: Load;
  truck: Truck;
  freightOwner: User | null;
};

type PendingDecision = {
  matchId: string;
  decision: "accept" | "reject";
  route: string;
  truckName: string;
} | null;

const statusLabels: Record<MatchStatus, string> = {
  recommended: "Recommended",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  completed: "Completed",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 2,
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatTonnes(valueKg: number) {
  return `${numberFormatter.format(valueKg / 1_000)} tonnes`;
}

function formatVehicleType(value: string) {
  return value.replaceAll("_", " ");
}

function resolveTransporterMatches(transporterId: string): ResolvedMatch[] {
  const trucks = getTrucksByTransporter(transporterId);
  const trucksById = new Map(trucks.map((truck) => [truck.id, truck]));

  return getMatches()
    .flatMap((match) => {
      const truck = trucksById.get(match.truckId);
      const load = getLoadById(match.loadId);

      if (!truck || !load) {
        return [];
      }

      return [
        {
          match,
          load,
          truck,
          freightOwner: getUserById(load.ownerId) ?? null,
        },
      ];
    })
    .sort(
      (left, right) =>
        new Date(
          right.match.decision?.timestamp ?? right.match.createdAt,
        ).getTime() -
        new Date(
          left.match.decision?.timestamp ?? left.match.createdAt,
        ).getTime(),
    );
}

export function TransporterMatchesPage() {
  const session = getCurrentSession();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("recommended");
  const [pendingDecision, setPendingDecision] = useState<PendingDecision>(null);
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  if (!session || session.role !== "transporter") {
    return (
      <section className="transporter-matches transporter-matches--state">
        <div className="transporter-matches__state-card" role="alert">
          <p className="transporter-matches__eyebrow">Load matching</p>
          <h1>Transporter session required</h1>
          <p>
            Sign in with a Transporter account to review load recommendations.
          </p>
        </div>
      </section>
    );
  }

  const matches = resolveTransporterMatches(session.id);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredMatches = matches.filter(
    ({ match, load, truck, freightOwner }) => {
      const matchesStatus =
        statusFilter === "all" || match.status === statusFilter;

      const searchableText = [
        match.id,
        load.id,
        load.origin.city,
        load.destination.city,
        load.cargoType,
        load.description,
        truck.displayName,
        truck.registrationDisplay,
        freightOwner?.name ?? "",
        freightOwner?.company ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    },
  );

  const recommendedCount = matches.filter(
    ({ match }) => match.status === "recommended",
  ).length;
  const acceptedCount = matches.filter(
    ({ match }) => match.status === "accepted" || match.status === "completed",
  ).length;
  const decidedCount = matches.filter(
    ({ match }) => match.status === "rejected" || match.status === "expired",
  ).length;

  const openDecision = (
    resolvedMatch: ResolvedMatch,
    decision: "accept" | "reject",
  ) => {
    setNotice(null);
    setError(null);
    setPendingDecision({
      matchId: resolvedMatch.match.id,
      decision,
      route: `${resolvedMatch.load.origin.city} → ${resolvedMatch.load.destination.city}`,
      truckName: resolvedMatch.truck.displayName,
    });
  };

  const confirmDecision = () => {
    if (!pendingDecision) {
      return;
    }

    setBusyMatchId(pendingDecision.matchId);
    setNotice(null);
    setError(null);

    try {
      if (pendingDecision.decision === "accept") {
        const result = acceptMatch(pendingDecision.matchId, session.id);

        setNotice(
          `Load accepted. Contract ${result.receipt.contractId} and trip ${result.trip.id} were created.`,
        );
      } else {
        rejectMatch(pendingDecision.matchId, session.id);
        setNotice(
          "Load recommendation rejected and recorded in the audit trail.",
        );
      }

      setPendingDecision(null);
      forceRefresh((value) => value + 1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the match decision.",
      );
    } finally {
      setBusyMatchId(null);
    }
  };

  return (
    <section
      className="transporter-matches"
      aria-labelledby="transporter-matches-heading"
    >
      <header className="transporter-matches__header">
        <div>
          <p className="transporter-matches__eyebrow">Load matching</p>
          <h1 id="transporter-matches-heading">Recommended loads</h1>
          <p>
            Review compatible cargo for your trucks, inspect every matching
            rule, then accept or reject the recommendation.
          </p>
        </div>

        <Link
          className="transporter-matches__secondary-action"
          to={ROUTES.transporterTrucks}
        >
          Manage trucks
        </Link>
      </header>

      {notice ? (
        <div
          className="transporter-matches__feedback transporter-matches__feedback--success"
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
          className="transporter-matches__feedback transporter-matches__feedback--error"
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
        className="transporter-matches__summary"
        aria-label="Match summary"
      >
        <article>
          <span>Total recommendations</span>
          <strong>{matches.length}</strong>
        </article>
        <article>
          <span>Awaiting decision</span>
          <strong>{recommendedCount}</strong>
        </article>
        <article>
          <span>Accepted bookings</span>
          <strong>{acceptedCount}</strong>
        </article>
        <article>
          <span>Rejected or expired</span>
          <strong>{decidedCount}</strong>
        </article>
      </section>

      <section
        className="transporter-matches__toolbar"
        aria-label="Match filters"
      >
        <label>
          <span>Search recommendations</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Route, cargo, truck or freight owner"
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
            <option value="recommended">Recommended</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </section>

      {matches.length === 0 ? (
        <section className="transporter-matches__empty">
          <div className="transporter-matches__empty-icon" aria-hidden="true">
            LD
          </div>
          <h2>No load recommendations yet</h2>
          <p>
            Keep at least one truck available. Recommendations appear after a
            Freight Owner generates matches for an open load.
          </p>
          <Link to={ROUTES.transporterTrucks}>Check truck availability</Link>
        </section>
      ) : filteredMatches.length === 0 ? (
        <section className="transporter-matches__empty">
          <h2>No recommendations match these filters</h2>
          <p>Clear the search or choose another match status.</p>
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
        <div className="transporter-matches__list">
          {filteredMatches.map((resolvedMatch) => {
            const { match, load, truck, freightOwner } = resolvedMatch;
            const canDecide =
              match.eligible &&
              match.status === "recommended" &&
              load.status === "open" &&
              truck.status === "available";
            const isBusy = busyMatchId === match.id;

            const rules = [
              {
                label: "Capacity",
                check: match.ruleChecks.capacity,
              },
              {
                label: "Vehicle compatibility",
                check: match.ruleChecks.compatibility,
              },
              {
                label: "Pickup location",
                check: match.ruleChecks.location,
              },
              {
                label: "Availability",
                check: match.ruleChecks.availability,
              },
            ];

            return (
              <article className="transporter-load-match-card" key={match.id}>
                <div className="transporter-load-match-card__top">
                  <div
                    className="transporter-load-match-card__score"
                    aria-label={`${match.score} percent match score`}
                  >
                    <strong>{match.score}%</strong>
                    <span>match</span>
                  </div>

                  <div className="transporter-load-match-card__heading">
                    <p>
                      {match.id} · {load.id}
                    </p>
                    <h2>
                      {load.origin.city} → {load.destination.city}
                    </h2>
                    <span>{load.cargoType}</span>
                  </div>

                  <span
                    className={`transporter-match-status transporter-match-status--${match.status}`}
                  >
                    {statusLabels[match.status]}
                  </span>
                </div>

                <div className="transporter-load-match-card__body">
                  <dl className="transporter-load-match-card__details">
                    <div>
                      <dt>Load weight</dt>
                      <dd>{formatTonnes(load.weightKg)}</dd>
                    </div>
                    <div>
                      <dt>Load volume</dt>
                      <dd>{numberFormatter.format(load.volumeM3)} m³</dd>
                    </div>
                    <div>
                      <dt>Required vehicle</dt>
                      <dd>{formatVehicleType(load.requiredVehicleType)}</dd>
                    </div>
                    <div>
                      <dt>Assigned truck</dt>
                      <dd>
                        {truck.displayName} · {truck.registrationDisplay}
                      </dd>
                    </div>
                    <div>
                      <dt>Truck capacity</dt>
                      <dd>
                        {formatTonnes(truck.capacityKg)} ·{" "}
                        {numberFormatter.format(truck.capacityM3)} m³
                      </dd>
                    </div>
                    <div>
                      <dt>Truck location</dt>
                      <dd>
                        {truck.currentLocation.city},{" "}
                        {truck.currentLocation.province}
                      </dd>
                    </div>
                    <div>
                      <dt>Pickup window</dt>
                      <dd>
                        {formatDateTime(load.pickupWindow.start)}
                        <br />
                        to {formatDateTime(load.pickupWindow.end)}
                      </dd>
                    </div>
                    <div>
                      <dt>Freight owner</dt>
                      <dd>
                        {freightOwner?.company ?? "Unknown organization"}
                        {freightOwner
                          ? ` · ${
                              freightOwner.rating === null
                                ? "New"
                                : `${freightOwner.rating.toFixed(1)}/5`
                            }`
                          : ""}
                      </dd>
                    </div>
                  </dl>

                  <div className="transporter-load-match-card__description">
                    <span>Cargo description</span>
                    <p>{load.description}</p>
                  </div>

                  <details className="transporter-load-match-card__rules">
                    <summary>View matching explanation</summary>
                    <ul>
                      {rules.map(({ label, check }) => (
                        <li
                          key={label}
                          className={
                            check.passed
                              ? "transporter-match-rule transporter-match-rule--passed"
                              : "transporter-match-rule transporter-match-rule--failed"
                          }
                        >
                          <span aria-hidden="true">
                            {check.passed ? "✓" : "×"}
                          </span>
                          <div>
                            <strong>{label}</strong>
                            <p>{check.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <footer className="transporter-load-match-card__footer">
                  <div>
                    <span>Created {formatDateTime(match.createdAt)}</span>
                    {match.decision ? (
                      <small>
                        Decision recorded{" "}
                        {formatDateTime(match.decision.timestamp)}
                      </small>
                    ) : (
                      <small>Awaiting your decision</small>
                    )}
                  </div>

                  {canDecide ? (
                    <div className="transporter-load-match-card__actions">
                      <button
                        type="button"
                        className="transporter-load-match-card__reject"
                        disabled={isBusy}
                        onClick={() => openDecision(resolvedMatch, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="transporter-load-match-card__accept"
                        disabled={isBusy}
                        onClick={() => openDecision(resolvedMatch, "accept")}
                      >
                        Accept load
                      </button>
                    </div>
                  ) : (
                    <span className="transporter-load-match-card__locked">
                      {match.status === "recommended"
                        ? "This recommendation is no longer available for a decision."
                        : `Decision complete: ${statusLabels[
                            match.status
                          ].toLowerCase()}.`}
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {pendingDecision ? (
        <div
          className="transporter-match-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyMatchId) {
              setPendingDecision(null);
            }
          }}
        >
          <section
            className="transporter-match-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transporter-match-decision-heading"
          >
            <p className="transporter-matches__eyebrow">Confirm decision</p>
            <h2 id="transporter-match-decision-heading">
              {pendingDecision.decision === "accept"
                ? "Accept this load?"
                : "Reject this recommendation?"}
            </h2>
            <p>
              <strong>{pendingDecision.route}</strong> will use{" "}
              <strong>{pendingDecision.truckName}</strong>.
            </p>

            {pendingDecision.decision === "accept" ? (
              <p>
                Accepting reserves the truck, matches the load, expires
                conflicting recommendations, and creates a digital receipt and
                trip.
              </p>
            ) : (
              <p>
                Rejecting closes this recommendation and records the decision in
                the audit trail.
              </p>
            )}

            <div className="transporter-match-modal__actions">
              <button
                type="button"
                className="transporter-match-modal__cancel"
                disabled={Boolean(busyMatchId)}
                onClick={() => setPendingDecision(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  pendingDecision.decision === "accept"
                    ? "transporter-match-modal__confirm transporter-match-modal__confirm--accept"
                    : "transporter-match-modal__confirm transporter-match-modal__confirm--reject"
                }
                disabled={Boolean(busyMatchId)}
                onClick={confirmDecision}
              >
                {busyMatchId
                  ? "Saving..."
                  : pendingDecision.decision === "accept"
                    ? "Confirm acceptance"
                    : "Confirm rejection"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
