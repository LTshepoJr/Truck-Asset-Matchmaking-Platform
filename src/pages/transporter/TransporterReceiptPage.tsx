import { Link, useParams } from "react-router-dom";

import "../../styles/transporter-css/TransporterReceiptPage.css";

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

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 2,
});

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function formatTonnes(valueKg: number): string {
  return `${numberFormatter.format(valueKg / 1_000)} tonnes`;
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

export function TransporterReceiptPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const session = getCurrentSession();

  const match = matchId ? getMatchById(matchId) : undefined;
  const receipt = matchId ? getReceiptByMatchId(matchId) : undefined;
  const trip = matchId ? getTripByMatchId(matchId) : undefined;

  const load = match ? getLoadById(match.loadId) : undefined;
  const truck = match ? getTruckById(match.truckId) : undefined;

  const freightOwner = load ? getUserById(load.ownerId) : undefined;
  const actor = receipt ? getUserById(receipt.actorId) : undefined;

  const vehicleLabel = truck
    ? (getVehicleTypes().find(
        (vehicleType) => vehicleType.id === truck.vehicleType,
      )?.label ?? formatStatus(truck.vehicleType))
    : "";

  const canViewReceipt =
    session?.role === "transporter" &&
    Boolean(truck) &&
    truck?.transporterId === session.id;

  if (!canViewReceipt) {
    return (
      <section className="transporter-receipt-page">
        <div className="transporter-receipt-page__alert" role="alert">
          This confirmation receipt is unavailable or does not belong to your
          Transporter account.
        </div>

        <Link
          className="transporter-receipt-page__secondary-action"
          to={ROUTES.transporterMatches}
        >
          Back to matches
        </Link>
      </section>
    );
  }

  if (!receipt || !match || !load || !truck || !trip) {
    return (
      <section className="transporter-receipt-page">
        <div className="transporter-receipt-page__alert" role="alert">
          The digital confirmation record could not be found.
        </div>

        <Link
          className="transporter-receipt-page__secondary-action"
          to={ROUTES.transporterMatches}
        >
          Back to matches
        </Link>
      </section>
    );
  }

  const dashboardTripPath = `${ROUTES.transporter}#active-trip`;

  return (
    <section className="transporter-receipt-page">
      <header className="transporter-receipt-page__header">
        <div>
          <p className="transporter-receipt-page__eyebrow">
            Digital confirmation
          </p>
          <h1>Load accepted</h1>
          <p>
            This receipt confirms the selected load, assigned truck and recorded
            acceptance details.
          </p>
        </div>

        <div className="transporter-receipt-page__header-actions">
          <button
            type="button"
            className="transporter-receipt-page__secondary-action"
            onClick={() => window.print()}
          >
            Print receipt
          </button>

          <Link
            className="transporter-receipt-page__primary-action"
            to={dashboardTripPath}
          >
            View active trip
          </Link>
        </div>
      </header>

      <article className="transporter-receipt-page__receipt">
        <div className="transporter-receipt-page__receipt-top">
          <div>
            <span className="transporter-receipt-page__brand">TAMP</span>
            <p>Truck Asset Matchmaking Platform</p>
          </div>

          <span className="transporter-receipt-page__confirmed">
            Confirmed
          </span>
        </div>

        <div className="transporter-receipt-page__contract">
          <span>Contract ID</span>
          <strong>{receipt.contractId}</strong>
        </div>

        <dl className="transporter-receipt-page__decision-grid">
          <div>
            <dt>Match ID</dt>
            <dd>{match.id}</dd>
          </div>

          <div>
            <dt>Decision</dt>
            <dd className="transporter-receipt-page__accepted">
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

        <section className="transporter-receipt-page__section">
          <div className="transporter-receipt-page__section-heading">
            <h2>Engagement details</h2>
            <span>{trip.id}</span>
          </div>

          <div className="transporter-receipt-page__route">
            <div>
              <span>Origin</span>
              <strong>{load.origin.city}</strong>
              <small>{load.origin.province}</small>
            </div>

            <div
              className="transporter-receipt-page__route-line"
              aria-hidden="true"
            >
              <span />
              <div />
              <span />
            </div>

            <div className="transporter-receipt-page__destination">
              <span>Destination</span>
              <strong>{load.destination.city}</strong>
              <small>{load.destination.province}</small>
            </div>
          </div>

          <dl className="transporter-receipt-page__details-grid">
            <div>
              <dt>Load ID</dt>
              <dd>{load.id}</dd>
            </div>

            <div>
              <dt>Cargo</dt>
              <dd>{load.cargoType}</dd>
            </div>

            <div>
              <dt>Weight / volume</dt>
              <dd>
                {formatTonnes(load.weightKg)} /{" "}
                {numberFormatter.format(load.volumeM3)} m³
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
          </dl>
        </section>

        <section className="transporter-receipt-page__section">
          <h2>Truck assignment</h2>

          <dl className="transporter-receipt-page__details-grid">
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
              <dt>Capacity</dt>
              <dd>
                {formatTonnes(truck.capacityKg)} /{" "}
                {numberFormatter.format(truck.capacityM3)} m³
              </dd>
            </div>
          </dl>
        </section>

        <section className="transporter-receipt-page__section">
          <h2>Freight Owner</h2>

          <dl className="transporter-receipt-page__details-grid">
            <div>
              <dt>Organization</dt>
              <dd>{freightOwner?.company ?? "Unknown organization"}</dd>
            </div>

            <div>
              <dt>Contact</dt>
              <dd>{freightOwner?.name ?? load.ownerId}</dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{freightOwner?.email ?? "Not available"}</dd>
            </div>

            <div>
              <dt>Rating</dt>
              <dd>
                {freightOwner?.rating === null ||
                freightOwner?.rating === undefined
                  ? "New"
                  : `${freightOwner.rating.toFixed(1)}/5`}
              </dd>
            </div>
          </dl>
        </section>

        <section className="transporter-receipt-page__section transporter-receipt-page__evidence">
          <h2>Confirmation evidence</h2>

          <dl className="transporter-receipt-page__details-grid">
            <div>
              <dt>Receipt status</dt>
              <dd>{formatStatus(receipt.status)}</dd>
            </div>

            <div>
              <dt>Trip status</dt>
              <dd>{formatStatus(trip.status)}</dd>
            </div>

            <div>
              <dt>IP address</dt>
              <dd>{receipt.ipAddress}</dd>
            </div>

            <div>
              <dt>User agent</dt>
              <dd>{receipt.userAgent}</dd>
            </div>
          </dl>
        </section>

        <footer className="transporter-receipt-page__receipt-footer">
          <p>Digital Receipt</p>
          <time dateTime={receipt.timestamp}>
            {formatDateTime(receipt.timestamp)}
          </time>
        </footer>
      </article>

      <div className="transporter-receipt-page__bottom-actions">
        <Link
          className="transporter-receipt-page__secondary-action"
          to={ROUTES.transporterMatches}
        >
          Back to matches
        </Link>

        <Link
          className="transporter-receipt-page__primary-action"
          to={dashboardTripPath}
        >
          View active trip
        </Link>
      </div>
    </section>
  );
}
