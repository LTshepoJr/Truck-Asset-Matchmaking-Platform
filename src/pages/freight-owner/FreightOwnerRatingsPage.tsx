import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import "../../styles/freight-owner-css/FreightOwnerRatingsPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  createRating,
  getLoadById,
  getMatchById,
  getRatingsByReviewer,
  getTripsByFreightOwner,
  getTruckById,
  getUserById,
} from "../../services/mockDb";

import type {
  Load,
  Match,
  Rating,
  RatingScore,
  Trip,
  Truck,
  User,
} from "../../types/tamp";

const SCORE_OPTIONS: Array<{
  score: RatingScore;
  label: string;
}> = [
  { score: 1, label: "Poor" },
  { score: 2, label: "Fair" },
  { score: 3, label: "Good" },
  { score: 4, label: "Very good" },
  { score: 5, label: "Excellent" },
];

const OTHER_COMMENT_VALUE = "other";

const LOW_SCORE_COMMENTS = [
  "The delivery was late or missed the agreed schedule.",
  "Communication during the trip was poor.",
  "The cargo handling or overall service did not meet expectations.",
];

const MID_SCORE_COMMENTS = [
  "The delivery was completed, but communication could improve.",
  "The service was acceptable, with minor delays or issues.",
  "The cargo arrived safely, but the overall experience was average.",
];

const HIGH_SCORE_COMMENTS = [
  "The delivery was completed on time and professionally.",
  "Communication was clear throughout the trip.",
  "The cargo was handled safely and delivered as agreed.",
];

function getCommonComments(score: RatingScore | 0): string[] {
  if (score === 1 || score === 2) {
    return LOW_SCORE_COMMENTS;
  }

  if (score === 3) {
    return MID_SCORE_COMMENTS;
  }

  if (score === 4 || score === 5) {
    return HIGH_SCORE_COMMENTS;
  }

  return [];
}

interface RateableTrip {
  trip: Trip;
  match: Match;
  load: Load;
  truck: Truck;
  transporter: User;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function formatStars(score: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(score)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function buildRateableTrips(ownerId: string): RateableTrip[] {
  return getTripsByFreightOwner(ownerId)
    .filter((trip) => trip.status === "completed")
    .flatMap((trip) => {
      const match = getMatchById(trip.matchId);

      if (!match) {
        return [];
      }

      const load = getLoadById(match.loadId);
      const truck = getTruckById(match.truckId);

      if (!load || !truck) {
        return [];
      }

      const transporter = getUserById(truck.transporterId);

      if (!transporter || transporter.role !== "transporter") {
        return [];
      }

      return [{ trip, match, load, truck, transporter }];
    })
    .sort(
      (a, b) =>
        new Date(b.trip.lastUpdatedAt).getTime() -
        new Date(a.trip.lastUpdatedAt).getTime(),
    );
}

export function FreightOwnerRatingsPage() {
  const session = getCurrentSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const sessionId = session?.id;
  const sessionRole = session?.role;

  const rateableTrips = useMemo(() => {
    if (!sessionId || sessionRole !== "freight-owner") {
      return [];
    }

    return buildRateableTrips(sessionId);
  }, [sessionId, sessionRole]);

  const [ratings, setRatings] = useState<Rating[]>(() =>
    sessionId ? getRatingsByReviewer(sessionId) : [],
  );

  const requestedTripId = searchParams.get("tripId");
  const initialTripId =
    rateableTrips.find(({ trip }) => trip.id === requestedTripId)?.trip.id ??
    rateableTrips.find(
      ({ trip }) => !ratings.some((rating) => rating.tripId === trip.id),
    )?.trip.id ??
    rateableTrips[0]?.trip.id ??
    "";

  const [selectedTripId, setSelectedTripId] = useState(initialTripId);
  const [score, setScore] = useState<RatingScore | 0>(0);
  const [commentChoice, setCommentChoice] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedTrip = rateableTrips.find(
    ({ trip }) => trip.id === selectedTripId,
  );

  const existingRating = ratings.find(
    (rating) =>
      rating.tripId === selectedTripId && rating.reviewerId === sessionId,
  );

  const submittedCount = rateableTrips.filter(({ trip }) =>
    ratings.some(
      (rating) => rating.tripId === trip.id && rating.reviewerId === sessionId,
    ),
  ).length;

  const pendingCount = rateableTrips.length - submittedCount;
  const averageScore =
    ratings.length === 0
      ? null
      : ratings.reduce((total, rating) => total + rating.score, 0) /
        ratings.length;

  const commonComments = getCommonComments(score);
  const isOtherComment = commentChoice === OTHER_COMMENT_VALUE;

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    setScore(0);
    setCommentChoice("");
    setComment("");
    setError("");
    setNotice("");

    if (tripId) {
      setSearchParams({ tripId });
    } else {
      setSearchParams({});
    }
  };

  const handleScoreChange = (nextScore: RatingScore) => {
    setScore(nextScore);

    /*
     * Each score range has different comments, so an
     * existing selection must be cleared when the score
     * changes.
     */
    setCommentChoice("");
    setComment("");
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!sessionId || !selectedTrip) {
      setError("The completed trip could not be resolved.");
      return;
    }

    if (score === 0) {
      setError("Choose a score from one to five stars.");
      return;
    }

    if (!commentChoice) {
      setError("Choose a comment that describes your experience.");
      return;
    }

    const resolvedComment =
      commentChoice === OTHER_COMMENT_VALUE ? comment.trim() : commentChoice;

    if (!resolvedComment) {
      setError("Enter your personal comment before submitting the review.");
      return;
    }

    setIsSubmitting(true);

    try {
      const rating = createRating({
        tripId: selectedTrip.trip.id,
        reviewerId: sessionId,
        reviewedUserId: selectedTrip.transporter.id,
        score,
        comment: resolvedComment,
      });

      setRatings(getRatingsByReviewer(sessionId));
      setScore(0);
      setCommentChoice("");
      setComment("");
      setNotice(
        `Your ${rating.score}-star review for ${selectedTrip.transporter.company} was submitted.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit your review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || session.role !== "freight-owner") {
    return (
      <section className="freight-ratings-page">
        <div className="freight-ratings-page__alert" role="alert">
          Your Freight Owner session could not be found. Please sign in again.
        </div>
      </section>
    );
  }

  return (
    <section className="freight-ratings-page">
      <header className="freight-ratings-page__header">
        <div>
          <h2>Ratings &amp; Reviews</h2>
          <p>
            Rate the transporter after a delivery has been completed. Each
            completed trip can be reviewed once.
          </p>
        </div>

        <Link
          className="freight-ratings-page__secondary-action"
          to={ROUTES.freightOwnerTracking}
        >
          Back to tracking
        </Link>
      </header>

      {error && (
        <div className="freight-ratings-page__alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div
          className="freight-ratings-page__alert freight-ratings-page__alert--success"
          role="status"
        >
          {notice}
        </div>
      )}

      {rateableTrips.length === 0 ? (
        <div className="freight-ratings-page__empty">
          <div className="freight-ratings-page__empty-stars" aria-hidden="true">
            ☆☆☆☆☆
          </div>
          <h3>No completed trips to review</h3>
          <p>
            A transporter can be rated only after the related trip reaches
            Completed.
          </p>
          <Link
            className="freight-ratings-page__primary-action"
            to={ROUTES.freightOwnerTracking}
          >
            View trip tracking
          </Link>
        </div>
      ) : (
        <>
          <div className="freight-ratings-page__summary">
            <article>
              <span>Completed trips</span>
              <strong>{rateableTrips.length}</strong>
            </article>
            <article>
              <span>Pending reviews</span>
              <strong>{pendingCount}</strong>
            </article>
            <article>
              <span>Reviews submitted</span>
              <strong>{submittedCount}</strong>
            </article>
            <article>
              <span>Your average score</span>
              <strong>
                {averageScore === null ? "—" : averageScore.toFixed(1)}
              </strong>
            </article>
          </div>

          <section className="freight-ratings-page__selector">
            <div className="freight-ratings-page__field">
              <label htmlFor="rating-trip">Completed delivery</label>
              <select
                id="rating-trip"
                value={selectedTripId}
                onChange={(event) => handleTripChange(event.target.value)}
              >
                {rateableTrips.map(({ trip, load, transporter }) => {
                  const hasRating = ratings.some(
                    (rating) =>
                      rating.tripId === trip.id &&
                      rating.reviewerId === sessionId,
                  );

                  return (
                    <option key={trip.id} value={trip.id}>
                      {trip.id} — {load.origin.city} to {load.destination.city}
                      {" — "}
                      {transporter.company}
                      {hasRating ? " — Reviewed" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>

          {selectedTrip ? (
            <div className="freight-ratings-page__layout">
              <TripReviewSummary details={selectedTrip} />

              {existingRating ? (
                <SubmittedRating
                  rating={existingRating}
                  transporter={selectedTrip.transporter}
                />
              ) : (
                <form
                  className="freight-ratings-page__form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="freight-ratings-page__form-header">
                    <div>
                      <h3>Rate the transporter</h3>
                      <p>
                        How would you rate the service provided by{" "}
                        {selectedTrip.transporter.company}?
                      </p>
                    </div>

                    {selectedTrip.transporter.rating !== null && (
                      <span>
                        Platform rating{" "}
                        {selectedTrip.transporter.rating.toFixed(1)}/5
                      </span>
                    )}
                  </div>

                  <fieldset className="freight-ratings-page__score-fieldset">
                    <legend>Overall score</legend>
                    <div
                      className="freight-ratings-page__stars"
                      role="radiogroup"
                      aria-label="Overall transporter score"
                    >
                      {SCORE_OPTIONS.map((option) => (
                        <label
                          key={option.score}
                          className={
                            score >= option.score
                              ? "freight-ratings-page__star freight-ratings-page__star--selected"
                              : "freight-ratings-page__star"
                          }
                        >
                          <input
                            type="radio"
                            name="rating-score"
                            value={option.score}
                            checked={score === option.score}
                            onChange={() => handleScoreChange(option.score)}
                          />
                          <span aria-hidden="true">★</span>
                          <small>
                            {option.score} — {option.label}
                          </small>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="freight-ratings-page__feedback">
                    <div className="freight-ratings-page__field">
                      <label htmlFor="rating-comment-choice">
                        Comment <span>(required)</span>
                      </label>

                      <select
                        id="rating-comment-choice"
                        value={commentChoice}
                        disabled={score === 0}
                        required
                        onChange={(event) => {
                          const nextChoice = event.target.value;

                          setCommentChoice(nextChoice);

                          if (nextChoice !== OTHER_COMMENT_VALUE) {
                            setComment("");
                          }

                          setError("");
                        }}
                      >
                        <option value="">
                          {score === 0
                            ? "Choose a star rating first"
                            : "Choose a comment"}
                        </option>

                        {commonComments.map((commonComment) => (
                          <option key={commonComment} value={commonComment}>
                            {commonComment}
                          </option>
                        ))}

                        {score !== 0 && (
                          <option value={OTHER_COMMENT_VALUE}>Other</option>
                        )}
                      </select>

                      <small>
                        The available comments change according to the selected
                        star rating.
                      </small>
                    </div>

                    {isOtherComment && (
                      <div className="freight-ratings-page__field">
                        <div className="freight-ratings-page__label-row">
                          <label htmlFor="rating-comment">
                            Personal comment
                          </label>

                          <small>{comment.length}/500</small>
                        </div>

                        <textarea
                          id="rating-comment"
                          value={comment}
                          onChange={(event) => {
                            setComment(event.target.value);
                            setError("");
                          }}
                          maxLength={500}
                          rows={6}
                          required
                          autoFocus
                          placeholder="Describe your experience with the transporter."
                        />
                      </div>
                    )}
                  </div>

                  <div className="freight-ratings-page__form-actions">
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting review..." : "Submit review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="freight-ratings-page__empty">
              <h3>Trip details unavailable</h3>
              <p>
                The selected trip could not be connected to its load, truck and
                transporter.
              </p>
            </div>
          )}

          {ratings.length > 0 && (
            <ReviewHistory ratings={ratings} trips={rateableTrips} />
          )}
        </>
      )}
    </section>
  );
}

function TripReviewSummary({ details }: { details: RateableTrip }) {
  const { trip, load, truck, transporter } = details;

  return (
    <aside className="freight-ratings-page__trip-card">
      <div className="freight-ratings-page__trip-card-header">
        <span>Completed delivery</span>
        <strong>{trip.id}</strong>
      </div>

      <div className="freight-ratings-page__transporter">
        <div
          className="freight-ratings-page__transporter-avatar"
          aria-hidden="true"
        >
          {transporter.company.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>{transporter.company}</h3>
          <p>{transporter.name}</p>
        </div>
      </div>

      <dl className="freight-ratings-page__trip-details">
        <div>
          <dt>Route</dt>
          <dd>
            {load.origin.city} → {load.destination.city}
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
          <dt>Cargo</dt>
          <dd>{load.cargoType}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{trip.contractId}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{formatDateTime(trip.lastUpdatedAt)}</dd>
        </div>
      </dl>

      <Link
        to={`${ROUTES.freightOwnerTracking}?tripId=${encodeURIComponent(
          trip.id,
        )}`}
      >
        View tracking history
      </Link>
    </aside>
  );
}

function SubmittedRating({
  rating,
  transporter,
}: {
  rating: Rating;
  transporter: User;
}) {
  return (
    <article className="freight-ratings-page__submitted">
      <div className="freight-ratings-page__submitted-icon" aria-hidden="true">
        ✓
      </div>
      <p className="freight-ratings-page__submitted-label">Review submitted</p>
      <h3>Thank you for rating {transporter.company}</h3>
      <div
        className="freight-ratings-page__submitted-stars"
        aria-label={`${rating.score} out of 5 stars`}
      >
        {formatStars(rating.score)}
      </div>
      <strong>{rating.score}/5</strong>
      {rating.comment && <blockquote>{rating.comment}</blockquote>}
      <time dateTime={rating.timestamp}>
        Submitted {formatDateTime(rating.timestamp)}
      </time>
      <p className="freight-ratings-page__submitted-note">
        Reviews cannot be edited in this MVP.
      </p>
    </article>
  );
}

function ReviewHistory({
  ratings,
  trips,
}: {
  ratings: Rating[];
  trips: RateableTrip[];
}) {
  const history = ratings
    .map((rating) => ({
      rating,
      trip: trips.find(({ trip }) => trip.id === rating.tripId),
    }))
    .filter(
      (
        item,
      ): item is {
        rating: Rating;
        trip: RateableTrip;
      } => Boolean(item.trip),
    )
    .sort(
      (a, b) =>
        new Date(b.rating.timestamp).getTime() -
        new Date(a.rating.timestamp).getTime(),
    );

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="freight-ratings-page__history">
      <div className="freight-ratings-page__history-header">
        <div>
          <h3>Your review history</h3>
          <p>Previously submitted transporter reviews.</p>
        </div>
        <span>
          {history.length} review{history.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="freight-ratings-page__history-list">
        {history.map(({ rating, trip }) => (
          <article key={rating.id}>
            <div>
              <strong>{trip.transporter.company}</strong>
              <span>
                {trip.load.origin.city} → {trip.load.destination.city}
              </span>
              <small>
                {trip.trip.id} · {formatDateTime(rating.timestamp)}
              </small>
            </div>
            <div className="freight-ratings-page__history-score">
              <span aria-label={`${rating.score} out of 5 stars`}>
                {formatStars(rating.score)}
              </span>
              <strong>{rating.score}/5</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
