import { Link, useNavigate } from "react-router-dom";

import { ROUTES } from "../routes/paths";

import "../styles/NotFoundPage.css";

export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <main className="not-found-page">
      <header className="not-found-page__header">
        <Link
          to={ROUTES.login}
          className="not-found-page__brand"
          aria-label="TAMP home"
        >
          <span className="not-found-page__brand-mark" aria-hidden="true" />

          <span className="not-found-page__brand-copy">
            <strong>TAMP</strong>
            <small>by Industrial Computing Engineering</small>
          </span>
        </Link>
      </header>

      <section
        className="not-found-page__content"
        aria-labelledby="not-found-title"
      >
        <div className="not-found-page__visual" aria-hidden="true">
          <span className="not-found-page__number">4</span>

          <div className="not-found-page__zero">
            <div className="not-found-page__road">
              <span />
              <span />
              <span />
            </div>
          </div>

          <span className="not-found-page__number">4</span>
        </div>

        <div className="not-found-page__message">
          <p className="not-found-page__eyebrow">Route not found</p>

          <h1 id="not-found-title">This route doesn&apos;t lead anywhere.</h1>

          <p className="not-found-page__description">
            The page may have moved, the address may be incorrect, or the route
            may no longer be available.
          </p>

          <div className="not-found-page__actions">
            <button
              type="button"
              className="not-found-page__back"
              onClick={handleGoBack}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Go back
            </button>

            <Link to={ROUTES.login} className="not-found-page__login-link">
              Return to sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="not-found-page__footer">
        <p>Industrial Computing Engineering (Pty) Ltd</p>

        <span aria-hidden="true" />

        <p>Truck Asset Matchmaking Platform</p>
      </footer>
    </main>
  );
}
