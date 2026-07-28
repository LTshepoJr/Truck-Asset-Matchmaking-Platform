import { useState, type SubmitEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import "../../styles/LoginPage.css";
import { authenticateRegisteredUser } from "../../services/authService";

type UserRole = "freight-owner" | "transporter" | "admin";

interface LoginPageFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginPageFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  loggedInAt: string;
}

const roleRoutes: Record<UserRole, string> = {
  "freight-owner": ROUTES.freightOwner,
  transporter: ROUTES.transporter,
  admin: ROUTES.admin,
};

interface LoginLocationState {
  registrationSuccess?: boolean;
  passwordResetSuccess?: boolean;
  email?: string;
}

interface MockUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}

const mockUsers: MockUser[] = [
  {
    id: "user-003",
    email: "tshepojr@kortestalkstech.co.za",
    password: "Password123!",
    role: "admin",
  },
];

const authenticateUser = async (
  email: string,
  password: string,
): Promise<UserSession> => {
  const registeredUser = await authenticateRegisteredUser(email, password);

  if (registeredUser) {
    return registeredUser;
  }

  /*
   * Temporary seeded users are retained for
   * the frontend MVP, particularly the Admin
   * demonstration account.
   */
  const normalizedEmail = email.trim().toLowerCase();

  const user = mockUsers.find(
    (mockUser) =>
      mockUser.email.toLowerCase() === normalizedEmail &&
      mockUser.password === password,
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    loggedInAt: new Date().toISOString(),
  };
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as LoginLocationState | null;

  const [formData, setFormData] = useState<LoginPageFormData>({
    email: locationState?.email ?? "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginPageFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(() => {
    if (locationState?.registrationSuccess) {
      return "Account created successfully. Sign in to continue.";
    }

    if (locationState?.passwordResetSuccess) {
      return "Password reset successfully. Sign in with your new password.";
    }

    return "";
  });
  const clearError = (field: keyof LoginPageFormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validateForm = (): LoginPageFormErrors => {
    const newErrors: LoginPageFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors({});
    setNotice("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await authenticateUser(formData.email, formData.password);

      const sessionData = JSON.stringify(session);

      if (formData.rememberMe) {
        localStorage.setItem("tamp-session", sessionData);
        sessionStorage.removeItem("tamp-session");
      } else {
        sessionStorage.setItem("tamp-session", sessionData);
        localStorage.removeItem("tamp-session");
      }

      navigate(roleRoutes[session.role]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";

      setErrors({
        general: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigate(ROUTES.forgotPassword);
  };

  return (
    <main className="login-page">
      <section
        className="login-page__hero"
        aria-label="Truck Asset Matchmaking Platform introduction"
      >
        <div className="login-page__hero-inner">
          <div className="login-page__hero-main">
            <div className="login-page__brand login-page__brand--light">
              <span className="login-page__brand-mark" aria-hidden="true" />

              <span className="login-page__brand-copy">
                <strong>TAMP</strong>
                <small>
                  Truck Asset Matchmaking Platform by Industrial Computing
                  Engineering
                </small>
              </span>
            </div>

            <div className="login-page__hero-copy">
              <p className="login-page__hero-label">
                Freight matching, made transparent
              </p>

              <h2>
                Move cargo with the
                <br />
                right truck, faster.
              </h2>

              <p className="login-page__hero-description">
                Post loads, discover compatible capacity, confirm engagements
                and track delivery progress in one workspace with the Truck
                Asset Matchmaking Platform
              </p>
            </div>
          </div>

          <p className="login-page__company">
            Industrial Computing Engineering (Pty) Ltd
          </p>
        </div>
      </section>

      <section className="login-page__panel" aria-labelledby="login-page-title">
        <div className="login-page__form-shell">
          <div className="login-page__mobile-brand">
            <div className="login-page__brand login-page__brand--dark">
              <span className="login-page__brand-mark" aria-hidden="true" />

              <span className="login-page__brand-copy">
                <strong>TAMP</strong>
                <small>
                  Truck Asset Matchmaking Platform by Industrial Computing
                  Engineering
                </small>
              </span>
            </div>
          </div>

          <header className="login-page__header">
            <p className="login-page__eyebrow">Welcome back</p>

            <h1 id="login-page-title">Sign in to TAMP</h1>

            <p className="login-page__subtitle">Use your account details</p>
          </header>

          {errors.general && (
            <div
              className="login-page__alert login-page__alert--error"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          {notice && (
            <div
              className="login-page__alert login-page__alert--info"
              role="status"
            >
              {notice}
            </div>
          )}

          <form className="login-page__form" onSubmit={handleSubmit} noValidate>
            <div className="login-page__field">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value,
                  }));

                  if (errors.email) {
                    clearError("email");
                  }
                }}
                placeholder="tshepojr@kortestalkstech.co.za"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />

              {errors.email && (
                <p
                  id="email-error"
                  className="login-page__field-error"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="login-page__field">
              <label htmlFor="password">Password</label>

              <div className="login-page__password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }));

                    if (errors.password) {
                      clearError("password");
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />

                <button
                  type="button"
                  className="login-page__password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 8a10.5 10.5 0 0 1-2.1 3.5M6.6 6.6C4.2 8 3 10.2 3 12c0 3 3.5 8 9 8 1.4 0 2.7-.3 3.8-.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <p
                  id="password-error"
                  className="login-page__field-error"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div className="login-page__form-options">
              <label className="login-page__remember">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      rememberMe: event.target.checked,
                    }))
                  }
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="login-page__forgot"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <button
              className="login-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <footer className="login-page__signup">
            <p>
              New to TAMP? <Link to="/register">Create an account</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
