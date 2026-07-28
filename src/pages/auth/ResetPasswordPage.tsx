import { useState, type SubmitEvent } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes/paths";

import { resetRegisteredUserPassword } from "../../services/authService";

import "../../styles/PasswordRecoveryPage.css";

interface ResetPasswordLocationState {
  resetToken?: string;
  email?: string;
}

interface ResetPasswordErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as ResetPasswordLocationState | null;

  const resetToken = state?.resetToken ?? "";

  const email = state?.email ?? "";

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<ResetPasswordErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): ResetPasswordErrors => {
    const newErrors: ResetPasswordErrors = {};

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8 || password.length > 15) {
      newErrors.password = "Password must be between 8 and 15 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one capital letter.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number.";
    } else if (!/[^A-Za-z0-9\s]/.test(password)) {
      newErrors.password = "Password must contain at least one symbol.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm your new password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors({});

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!resetToken) {
      setErrors({
        general: "This password reset request is invalid. Please start again.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      await resetRegisteredUserPassword(resetToken, password);

      navigate(ROUTES.login, {
        replace: true,
        state: {
          passwordResetSuccess: true,
          email,
        },
      });
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Unable to reset your password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resetToken) {
    return (
      <main className="recovery-page recovery-page--simple">
        <section className="recovery-page__invalid">
          <p className="recovery-page__eyebrow">Password recovery</p>

          <h1>Reset request unavailable</h1>

          <p>
            Start the password recovery process again to create a new reset
            request.
          </p>

          <Link
            className="recovery-page__primary-link"
            to={ROUTES.forgotPassword}
          >
            Start password recovery
          </Link>
        </section>
      </main>
    );
  }

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
            <p>Secure your account</p>

            <h2>
              Create a new
              <br />
              password.
            </h2>

            <span>
              Choose a strong password to restore access to your TAMP account.
            </span>
          </div>
        </div>
      </section>

      <section
        className="recovery-page__panel"
        aria-labelledby="reset-password-title"
      >
        <div className="recovery-page__form-shell">
          <Link className="recovery-page__back" to={ROUTES.login}>
            ← Back to sign in
          </Link>

          <header className="recovery-page__header">
            <p>New password</p>

            <h1 id="reset-password-title">Reset your password</h1>

            <span>
              Create a new password for <strong>{email}</strong>.
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
              <label htmlFor="new-password">New password</label>

              <div className="recovery-page__password-field">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (errors.password) {
                      setErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className="recovery-page__error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="recovery-page__field">
              <label htmlFor="confirm-new-password">Confirm new password</label>

              <input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);

                  if (errors.confirmPassword) {
                    setErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
              />

              {errors.confirmPassword && (
                <p className="recovery-page__error" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="recovery-page__requirements">
              <strong>Password requirements</strong>

              <p>
                8–15 characters with at least one capital letter, one number and
                one symbol.
              </p>
            </div>

            <button
              className="recovery-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
