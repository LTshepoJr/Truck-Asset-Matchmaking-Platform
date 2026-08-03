import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import "../../styles/FreightOwnerMatchesPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  acceptMatch,
  generateMatchesForLoad,
  getLoadsByOwner,
  getMatchesForLoad,
  getTruckById,
  getUserById,
  getVehicleTypes,
  rejectMatch,
} from "../../services/mockDb";

import type { Load, Match, Truck } from "../../types/tamp";

const RULE_LABELS: Array<[keyof Match["ruleChecks"], string]> = [
  ["capacity", "Capacity"],
  ["compatibility", "Compatibility"],
  ["availability", "Availability"],
  ["location", "Location"],
];

interface MatchCardData {
  match: Match;
  truck: Truck;
  transporterName: string;
  vehicleLabel: string;
}

interface DecisionRequest {
  match: Match;
  decision: "accept" | "reject";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => b.score - a.score);
}

function getMatchStatusLabel(status: Match["status"]): string {
  const labels: Record<Match["status"], string> = {
    recommended: "Recommended",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
    completed: "Completed",
  };

  return labels[status];
}

export function FreightOwnerMatchesPage() {
  const session = getCurrentSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const sessionId = session?.id;
  const sessionRole = session?.role;

  const [ownerLoads, setOwnerLoads] = useState<Load[]>(() => {
    if (!sessionId || sessionRole !== "freight-owner") {
      return [];
    }

    return getLoadsByOwner(sessionId);
  });

  const requestedLoadId = searchParams.get("loadId");

  const initialLoadId =
    ownerLoads.find((load) => load.id === requestedLoadId)?.id ??
    ownerLoads.find((load) => load.status === "open")?.id ??
    ownerLoads[0]?.id ??
    "";

  const [selectedLoadId, setSelectedLoadId] = useState(initialLoadId);

  const [matches, setMatches] = useState<Match[]>(() =>
    initialLoadId ? sortMatches(getMatchesForLoad(initialLoadId)) : [],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [decisionRequest, setDecisionRequest] =
    useState<DecisionRequest | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
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

  const selectedLoad = ownerLoads.find((load) => load.id === selectedLoadId);

  const matchCards = useMemo<MatchCardData[]>(() => {
    return matches.flatMap((match) => {
      const truck = getTruckById(match.truckId);

      if (!truck) {
        return [];
      }

      const transporter = getUserById(truck.transporterId);

      return [
        {
          match,
          truck,
          transporterName:
            transporter?.company ?? transporter?.name ?? "Transporter",
          vehicleLabel:
            vehicleLabels.get(truck.vehicleType) ?? truck.vehicleType,
        },
      ];
    });
  }, [matches, vehicleLabels]);

  const eligibleMatches = matchCards.filter(
    ({ match }) =>
      match.eligible &&
      (match.status === "recommended" ||
        match.status === "accepted" ||
        match.status === "completed"),
  );

  const rejectedMatches = matchCards.filter(
    ({ match }) =>
      !match.eligible ||
      match.status === "rejected" ||
      match.status === "expired",
  );

  const refreshSelectedLoadData = () => {
    if (!selectedLoadId) {
      return;
    }

    setMatches(sortMatches(getMatchesForLoad(selectedLoadId)));

    if (sessionId && sessionRole === "freight-owner") {
      setOwnerLoads(getLoadsByOwner(sessionId));
    }
  };

  const handleLoadChange = (loadId: string) => {
    setSelectedLoadId(loadId);
    setMatches(loadId ? sortMatches(getMatchesForLoad(loadId)) : []);
    setDecisionRequest(null);
    setError("");
    setNotice("");

    if (loadId) {
      setSearchParams({ loadId });
    } else {
      setSearchParams({});
    }
  };

  const handleGenerateMatches = () => {
    if (!selectedLoad) {
      setError("Select a load before generating recommendations.");
      return;
    }

    if (selectedLoad.status !== "open") {
      setError(
        `Only open loads can generate new recommendations. This load is "${selectedLoad.status}".`,
      );
      return;
    }

    setIsGenerating(true);
    setError("");
    setNotice("");

    try {
      const createdMatches = generateMatchesForLoad(selectedLoad.id);

      refreshSelectedLoadData();

      setNotice(
        createdMatches.length > 0
          ? `${createdMatches.length} available truck${
              createdMatches.length === 1 ? " was" : "s were"
            } evaluated.`
          : "Recommendations are already up to date for the currently available trucks.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate match recommendations.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmDecision = () => {
    if (!decisionRequest || !sessionId) {
      return;
    }

    setIsDeciding(true);
    setError("");
    setNotice("");

    try {
      if (decisionRequest.decision === "accept") {
        const result = acceptMatch(decisionRequest.match.id, sessionId);

        refreshSelectedLoadData();
        setDecisionRequest(null);

        navigate(
          `${ROUTES.freightOwnerReceipts}/${encodeURIComponent(
            result.match.id,
          )}`,
        );

        return;
      }

      rejectMatch(decisionRequest.match.id, sessionId);

      refreshSelectedLoadData();
      setDecisionRequest(null);
      setNotice(
        `Match ${decisionRequest.match.id} was rejected and the decision was recorded.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to record the match decision.",
      );
    } finally {
      setIsDeciding(false);
    }
  };

  if (!session || session.role !== "freight-owner") {
    return (
      <section className="freight-matches-page">
        <div className="freight-matches-page__alert" role="alert">
          Your Freight Owner session could not be found. Please sign in again.
        </div>
      </section>
    );
  }

  return (
    <section className="freight-matches-page">
      <header className="freight-matches-page__header">
        <div>
          <h2>Matches</h2>

          <p>
            Compare available trucks using transparent capacity, compatibility,
            availability and location checks.
          </p>
        </div>

        <Link
          className="freight-matches-page__secondary-action"
          to={ROUTES.freightOwnerLoads}
        >
          Back to my loads
        </Link>
      </header>

      {error && (
        <div className="freight-matches-page__alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div
          className="freight-matches-page__alert freight-matches-page__alert--success"
          role="status"
        >
          {notice}
        </div>
      )}

      {ownerLoads.length === 0 ? (
        <div className="freight-matches-page__empty">
          <h3>No loads available for matching</h3>

          <p>
            Post a cargo load first, then return here to find compatible
            available trucks.
          </p>

          <Link
            className="freight-matches-page__primary-action"
            to={ROUTES.freightOwnerNewLoad}
          >
            Post a load
          </Link>
        </div>
      ) : (
        <>
          <section className="freight-matches-page__controls">
            <div className="freight-matches-page__field">
              <label htmlFor="match-load">Load</label>

              <select
                id="match-load"
                value={selectedLoadId}
                onChange={(event) => handleLoadChange(event.target.value)}
              >
                {ownerLoads.map((load) => (
                  <option key={load.id} value={load.id}>
                    {load.id} — {load.origin.city} to {load.destination.city}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerateMatches}
              disabled={
                isGenerating || !selectedLoad || selectedLoad.status !== "open"
              }
            >
              {isGenerating ? "Checking trucks..." : "Generate recommendations"}
            </button>
          </section>

          {selectedLoad && <SelectedLoadSummary load={selectedLoad} />}

          {matches.length === 0 ? (
            <div className="freight-matches-page__empty">
              <h3>No matching run has been completed</h3>

              <p>
                Generate recommendations to compare this load with the available
                trucks in the mock database.
              </p>

              {selectedLoad?.status === "open" && (
                <button
                  type="button"
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                >
                  Generate recommendations
                </button>
              )}
            </div>
          ) : (
            <div className="freight-matches-page__results">
              <div className="freight-matches-page__results-heading">
                <div>
                  <h3>Eligible trucks</h3>

                  <p>
                    {eligibleMatches.length} eligible match
                    {eligibleMatches.length === 1 ? "" : "es"}
                  </p>
                </div>
              </div>

              {eligibleMatches.length === 0 ? (
                <div className="freight-matches-page__empty freight-matches-page__empty--compact">
                  <h3>No eligible trucks found</h3>

                  <p>
                    The evaluated trucks failed one or more required matching
                    rules. Review the rejected candidates below to see why.
                  </p>
                </div>
              ) : (
                <div className="freight-matches-page__list">
                  {eligibleMatches.map((card) => (
                    <MatchCard
                      key={card.match.id}
                      card={card}
                      onAccept={(match) =>
                        setDecisionRequest({
                          match,
                          decision: "accept",
                        })
                      }
                      onReject={(match) =>
                        setDecisionRequest({
                          match,
                          decision: "reject",
                        })
                      }
                    />
                  ))}
                </div>
              )}

              {rejectedMatches.length > 0 && (
                <details className="freight-matches-page__rejected">
                  <summary>
                    Review {rejectedMatches.length} rejected or expired
                    candidate
                    {rejectedMatches.length === 1 ? "" : "s"}
                  </summary>

                  <div className="freight-matches-page__list">
                    {rejectedMatches.map((card) => (
                      <MatchCard
                        key={card.match.id}
                        card={card}
                        isRejected
                        onAccept={() => undefined}
                        onReject={() => undefined}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}

      {decisionRequest && (
        <DecisionModal
          request={decisionRequest}
          isSubmitting={isDeciding}
          onCancel={() => setDecisionRequest(null)}
          onConfirm={handleConfirmDecision}
        />
      )}
    </section>
  );
}

function SelectedLoadSummary({ load }: { load: Load }) {
  return (
    <article className="freight-matches-page__load-summary">
      <div>
        <span>Route</span>
        <strong>
          {load.origin.city} → {load.destination.city}
        </strong>
      </div>

      <div>
        <span>Cargo</span>
        <strong>{load.cargoType}</strong>
      </div>

      <div>
        <span>Required capacity</span>
        <strong>
          {load.weightKg.toLocaleString("en-ZA")} kg / {load.volumeM3} m³
        </strong>
      </div>

      <div>
        <span>Pickup</span>
        <strong>{formatDateTime(load.pickupWindow.start)}</strong>
      </div>

      <div>
        <span>Status</span>
        <strong className="freight-matches-page__load-status">
          {load.status.replace("_", " ")}
        </strong>
      </div>
    </article>
  );
}

interface MatchCardProps {
  card: MatchCardData;
  isRejected?: boolean;
  onAccept: (match: Match) => void;
  onReject: (match: Match) => void;
}

function MatchCard({
  card,
  isRejected = false,
  onAccept,
  onReject,
}: MatchCardProps) {
  const { match, truck, transporterName, vehicleLabel } = card;

  const receiptPath = `${
    ROUTES.freightOwnerReceipts
  }/${encodeURIComponent(match.id)}`;

  return (
    <article
      className={[
        "freight-matches-page__card",
        isRejected ? "freight-matches-page__card--rejected" : "",
        match.status === "accepted"
          ? "freight-matches-page__card--accepted"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="freight-matches-page__card-header">
        <div>
          <div className="freight-matches-page__match-heading">
            <p className="freight-matches-page__match-id">{match.id}</p>

            <span
              className={`freight-matches-page__match-status freight-matches-page__match-status--${match.status}`}
            >
              {getMatchStatusLabel(match.status)}
            </span>
          </div>

          <h4>{truck.displayName}</h4>

          <p>
            {transporterName} · {truck.registrationDisplay}
          </p>
        </div>

        <div
          className={`freight-matches-page__score ${
            match.eligible
              ? "freight-matches-page__score--eligible"
              : "freight-matches-page__score--rejected"
          }`}
          aria-label={`Match score ${match.score} out of 100`}
        >
          <strong>{match.score}</strong>
          <span>/100</span>
        </div>
      </div>

      <dl className="freight-matches-page__truck-details">
        <div>
          <dt>Vehicle</dt>
          <dd>{vehicleLabel}</dd>
        </div>

        <div>
          <dt>Capacity</dt>
          <dd>
            {truck.capacityKg.toLocaleString("en-ZA")} kg / {truck.capacityM3}{" "}
            m³
          </dd>
        </div>

        <div>
          <dt>Current location</dt>
          <dd>
            {truck.currentLocation.city}, {truck.currentLocation.province}
          </dd>
        </div>

        <div>
          <dt>Available</dt>
          <dd>
            {formatDateTime(truck.availabilityWindow.start)} –{" "}
            {formatDateTime(truck.availabilityWindow.end)}
          </dd>
        </div>
      </dl>

      <div className="freight-matches-page__rules">
        {RULE_LABELS.map(([ruleName, label]) => {
          const rule = match.ruleChecks[ruleName];

          return (
            <div
              key={ruleName}
              className={`freight-matches-page__rule ${
                rule.passed
                  ? "freight-matches-page__rule--passed"
                  : "freight-matches-page__rule--failed"
              }`}
            >
              <span aria-hidden="true">{rule.passed ? "✓" : "×"}</span>

              <div>
                <strong>{label}</strong>
                <p>{rule.reason}</p>
              </div>
            </div>
          );
        })}
      </div>

      {match.status === "recommended" && (
        <div className="freight-matches-page__card-actions">
          <button
            type="button"
            className="freight-matches-page__reject-action"
            onClick={() => onReject(match)}
          >
            Reject
          </button>

          <button type="button" onClick={() => onAccept(match)}>
            Accept match
          </button>
        </div>
      )}

      {(match.status === "accepted" || match.status === "completed") && (
        <div className="freight-matches-page__card-actions">
          <Link
            className="freight-matches-page__receipt-action"
            to={receiptPath}
          >
            View confirmation receipt
          </Link>
        </div>
      )}
    </article>
  );
}

interface DecisionModalProps {
  request: DecisionRequest;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DecisionModal({
  request,
  isSubmitting,
  onCancel,
  onConfirm,
}: DecisionModalProps) {
  const isAccepting = request.decision === "accept";

  return (
    <div
      className="freight-matches-page__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <section
        className="freight-matches-page__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-decision-title"
        aria-describedby="match-decision-description"
      >
        <div
          className={`freight-matches-page__modal-icon ${
            isAccepting
              ? "freight-matches-page__modal-icon--accept"
              : "freight-matches-page__modal-icon--reject"
          }`}
          aria-hidden="true"
        >
          {isAccepting ? "✓" : "×"}
        </div>

        <h3 id="match-decision-title">
          {isAccepting ? "Accept this match?" : "Reject this match?"}
        </h3>

        <p id="match-decision-description">
          {isAccepting
            ? "Accepting reserves this truck, marks the load as matched and creates a digital confirmation receipt and trip."
            : "Rejecting records your decision in the audit trail. This recommendation cannot be accepted afterwards."}
        </p>

        <dl className="freight-matches-page__modal-summary">
          <div>
            <dt>Match</dt>
            <dd>{request.match.id}</dd>
          </div>

          <div>
            <dt>Score</dt>
            <dd>{request.match.score}/100</dd>
          </div>
        </dl>

        <div className="freight-matches-page__modal-actions">
          <button
            type="button"
            className="freight-matches-page__secondary-action"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className={isAccepting ? "" : "freight-matches-page__danger-action"}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving decision..."
              : isAccepting
                ? "Accept and confirm"
                : "Reject match"}
          </button>
        </div>
      </section>
    </div>
  );
}
