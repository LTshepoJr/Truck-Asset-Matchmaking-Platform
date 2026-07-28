import { useState, type SubmitEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes/paths";

import { createPasswordResetRequest } from "../../services/authService";

import "../../styles/PasswordRecoveryPage.css";

interface ForgotPasswordErrors {
  email?: string;
  general?: string;
}

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setErrors({
        email: "Email address is required.",
      });

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({
        email: "Enter a valid email address.",
      });

      return false;
    }

    return true;
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors({});

    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const resetRequest = createPasswordResetRequest(email);

      if (!resetRequest) {
        setErrors({
          general:
            "We could not find a registered TAMP account with that email address.",
        });

        return;
      }

      navigate(ROUTES.resetPassword, {
        state: {
          resetToken: resetRequest.token,
          email: resetRequest.email,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="recovery-page">
      <section className="recovery-page__hero">
        <div className="recovery-page__hero-content">
          <div className="recovery-page__brand">
            <span className="recovery-page__brand-mark" aria-hidden="true" />

            <div>
              <strong>TAMP</strong>
              <small>Truck Asset Matchmaking Platform</small>
            </div>
          </div>

          <div className="recovery-page__hero-copy">
            <p>Password recovery</p>

            <h2>
              Get back to moving
              <br />
              freight.
            </h2>

            <span>
              Recover access to your TAMP account and continue managing your
              freight activity.
            </span>
          </div>
        </div>
      </section>

      <section
        className="recovery-page__panel"
        aria-labelledby="forgot-password-title"
      >
        <div className="recovery-page__form-shell">
          <Link className="recovery-page__back" to={ROUTES.login}>
            ← Back to sign in
          </Link>

          <header className="recovery-page__header">
            <p>Account recovery</p>

            <h1 id="forgot-password-title">Forgot your password?</h1>

            <span>
              Enter the email address associated with your TAMP account.
            </span>
          </header>

          {errors.general && (
            <div className="recovery-page__alert" role="alert">
              {errors.general}
            </div>
          )}

          <form
            className="recovery-page__form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="recovery-page__field">
              <label htmlFor="recovery-email">Email address</label>

              <input
                id="recovery-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (errors.email) {
                    setErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                  }
                }}
                placeholder="name@company.co.za"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "recovery-email-error" : undefined
                }
              />

              {errors.email && (
                <p
                  id="recovery-email-error"
                  className="recovery-page__error"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <button
              className="recovery-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Checking account..." : "Continue"}
            </button>
          </form>

          <footer className="recovery-page__footer">
            <p>
              Remembered your password? <Link to={ROUTES.login}>Sign in</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
