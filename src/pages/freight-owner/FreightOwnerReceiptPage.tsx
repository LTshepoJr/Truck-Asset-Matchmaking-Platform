import { Link, useParams } from "react-router-dom";

import "../../styles/freight-owner-css/FreightOwnerReceiptPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  getLoadById,
  getMatchById,
  getReceiptByMatchId,
  getTripByMatchId,
  getTruckById,
  getUserById,
  getVehicleTypes,
} from "../../services/mockDb";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

export function FreightOwnerReceiptPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const session = getCurrentSession();

  const match = matchId ? getMatchById(matchId) : undefined;

  const receipt = matchId ? getReceiptByMatchId(matchId) : undefined;

  const load = match ? getLoadById(match.loadId) : undefined;

  const truck = match ? getTruckById(match.truckId) : undefined;

  const transporter = truck ? getUserById(truck.transporterId) : undefined;

  const actor = receipt ? getUserById(receipt.actorId) : undefined;

  const trip = matchId ? getTripByMatchId(matchId) : undefined;

  const vehicleLabel = truck
    ? (getVehicleTypes().find(
        (vehicleType) => vehicleType.id === truck.vehicleType,
      )?.label ?? truck.vehicleType)
    : "";

  const canViewReceipt =
    session?.role === "freight-owner" &&
    Boolean(load) &&
    load?.ownerId === session.id;

  if (!canViewReceipt) {
    return (
      <section className="freight-receipt-page">
        <div className="freight-receipt-page__alert" role="alert">
          This confirmation receipt is unavailable or does not belong to your
          Freight Owner account.
        </div>

        <Link
          className="freight-receipt-page__secondary-action"
          to={ROUTES.freightOwnerMatches}
        >
          Back to matches
        </Link>
      </section>
    );
  }

  if (!receipt || !match || !load || !truck || !trip) {
    return (
      <section className="freight-receipt-page">
        <div className="freight-receipt-page__alert" role="alert">
          The digital confirmation record could not be found.
        </div>

        <Link
          className="freight-receipt-page__secondary-action"
          to={`${ROUTES.freightOwnerMatches}?loadId=${encodeURIComponent(
            load?.id ?? "",
          )}`}
        >
          Back to matches
        </Link>
      </section>
    );
  }

  const matchesPath = `${
    ROUTES.freightOwnerMatches
  }?loadId=${encodeURIComponent(load.id)}`;

  const trackingPath = `${
    ROUTES.freightOwnerTracking
  }?tripId=${encodeURIComponent(trip.id)}`;

  return (
    <section className="freight-receipt-page">
      <header className="freight-receipt-page__header">
        <div>
          <p className="freight-receipt-page__eyebrow">Digital confirmation</p>

          <h2>Match accepted</h2>

          <p>
            This receipt confirms the selected truck and records who accepted
            the engagement and when.
          </p>
        </div>

        <div className="freight-receipt-page__header-actions">
          <button
            type="button"
            className="freight-receipt-page__secondary-action"
            onClick={() => window.print()}
          >
            Print receipt
          </button>

          <Link
            className="freight-receipt-page__primary-action"
            to={trackingPath}
          >
            Continue to tracking
          </Link>
        </div>
      </header>

      <article className="freight-receipt-page__receipt">
        <div className="freight-receipt-page__receipt-top">
          <div>
            <span className="freight-receipt-page__brand">TAMP</span>

            <p>Truck Asset Matchmaking Platform</p>
          </div>

          <span className="freight-receipt-page__confirmed">Confirmed</span>
        </div>

        <div className="freight-receipt-page__contract">
          <span>Contract ID</span>
          <strong>{receipt.contractId}</strong>
        </div>

        <dl className="freight-receipt-page__decision-grid">
          <div>
            <dt>Match ID</dt>
            <dd>{match.id}</dd>
          </div>

          <div>
            <dt>Decision</dt>
            <dd className="freight-receipt-page__accepted">
              {receipt.decision}
            </dd>
          </div>

          <div>
            <dt>Accepted by</dt>
            <dd>{actor?.name ?? receipt.actorId}</dd>
          </div>

          <div>
            <dt>Decision time</dt>
            <dd>{formatDateTime(receipt.timestamp)}</dd>
          </div>
        </dl>

        <section className="freight-receipt-page__section">
          <div className="freight-receipt-page__section-heading">
            <h3>Engagement details</h3>
            <span>{trip.id}</span>
          </div>

          <div className="freight-receipt-page__route">
            <div>
              <span>Origin</span>
              <strong>{load.origin.city}</strong>
              <small>{load.origin.province}</small>
            </div>

            <div
              className="freight-receipt-page__route-line"
              aria-hidden="true"
            >
              <span />
              <div />
              <span />
            </div>

            <div className="freight-receipt-page__destination">
              <span>Destination</span>
              <strong>{load.destination.city}</strong>
              <small>{load.destination.province}</small>
            </div>
          </div>

          <dl className="freight-receipt-page__details-grid">
            <div>
              <dt>Load</dt>
              <dd>{load.id}</dd>
            </div>

            <div>
              <dt>Cargo</dt>
              <dd>{load.cargoType}</dd>
            </div>

            <div>
              <dt>Weight / volume</dt>
              <dd>
                {load.weightKg.toLocaleString("en-ZA")} kg / {load.volumeM3} m³
              </dd>
            </div>

            <div>
              <dt>Pickup window</dt>
              <dd>
                {formatDateTime(load.pickupWindow.start)} –{" "}
                {formatDateTime(load.pickupWindow.end)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="freight-receipt-page__section">
          <h3>Truck and transporter</h3>

          <dl className="freight-receipt-page__details-grid">
            <div>
              <dt>Truck</dt>
              <dd>{truck.displayName}</dd>
            </div>

            <div>
              <dt>Registration</dt>
              <dd>{truck.registrationDisplay}</dd>
            </div>

            <div>
              <dt>Vehicle type</dt>
              <dd>{vehicleLabel}</dd>
            </div>

            <div>
              <dt>Transporter</dt>
              <dd>
                {transporter?.company ??
                  transporter?.name ??
                  truck.transporterId}
              </dd>
            </div>
          </dl>
        </section>

        <section className="freight-receipt-page__section freight-receipt-page__evidence">
          <h3>Confirmation evidence</h3>

          <dl className="freight-receipt-page__details-grid">
            <div>
              <dt>Receipt status</dt>
              <dd>{receipt.status}</dd>
            </div>

            <div>
              <dt>IP address</dt>
              <dd>{receipt.ipAddress}</dd>
            </div>

            <div>
              <dt>User agent</dt>
              <dd>{receipt.userAgent}</dd>
            </div>

            <div>
              <dt>Trip status</dt>
              <dd>{trip.status.replace("_", " ")}</dd>
            </div>
          </dl>
        </section>

        <footer className="freight-receipt-page__receipt-footer">
          <p>Digital Receipt</p>

          <time dateTime={receipt.timestamp}>
            {formatDateTime(receipt.timestamp)}
          </time>
        </footer>
      </article>

      <div className="freight-receipt-page__bottom-actions">
        <Link
          className="freight-receipt-page__secondary-action"
          to={matchesPath}
        >
          Back to matches
        </Link>

        <Link
          className="freight-receipt-page__primary-action"
          to={trackingPath}
        >
          Track this trip
        </Link>
      </div>
    </section>
  );
}
