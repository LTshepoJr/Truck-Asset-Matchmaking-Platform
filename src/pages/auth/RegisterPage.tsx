import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/RegisterPage.css";
import { ROUTES } from "../../routes/paths";

type RegistrationRole = "freight-owner" | "transporter";

interface RegisterFormData {
  role: RegistrationRole | "";
  organizationName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface RegisterFormErrors {
  role?: string;
  organizationName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    role: "",
    organizationName: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: keyof RegisterFormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validateForm = (): RegisterFormErrors => {
    const newErrors: RegisterFormErrors = {};

    if (!formData.role) {
      newErrors.role = "Select an account type.";
    }

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "organization name is required.";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must contain at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\+?[0-9\s()-]{7,20}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Enter a valid phone number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8 || formData.password.length > 15) {
      newErrors.password = "Password must be between 8 and 15 characters.";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one capital letter.";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number.";
    } else if (!/[^A-Za-z0-9\s]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one symbol.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions.";
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

    setIsSubmitting(true);

    try {
      /*
       * Registration API integration will go here.
       *
       * Do not store the password in localStorage or
       * sessionStorage.
       *
       * Eventually:
       *
       * await authService.register({
       *   role: formData.role,
       *   organizationName: formData.organizationName,
       *   fullName: formData.fullName,
       *   email: formData.email,
       *   phoneNumber: formData.phoneNumber,
       *   password: formData.password,
       * });
       */

      await Promise.resolve();

      navigate(ROUTES.login);
    } catch {
      setErrors({
        general: "Unable to create your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section
        className="register-page__hero"
        aria-label="Truck Asset Matchmaking Platform introduction"
      >
        <div className="register-page__hero-inner">
          <div className="register-page__hero-main">
            <div className="register-page__brand register-page__brand--light">
              <span className="register-page__brand-mark" aria-hidden="true" />

              <span className="register-page__brand-copy">
                <strong>TAMP</strong>
                <small>
                  Truck Asset Matchmaking Platform by Industrial Computing
                  Engineering
                </small>
              </span>
            </div>

            <div className="register-page__hero-copy">
              <p className="register-page__hero-label">Join the TAMP network</p>

              <h2>
                Connect cargo with
                <br />
                available capacity.
              </h2>

              <p className="register-page__hero-description">
                Create your organization account and join a transparent freight
                marketplace built for freight owners and transporters.
              </p>
            </div>

            <div className="register-page__benefits">
              <div className="register-page__benefit">
                <span aria-hidden="true">01</span>

                <div>
                  <strong>Post opportunities</strong>
                  <p>
                    Publish cargo loads or make available truck capacity
                    visible.
                  </p>
                </div>
              </div>

              <div className="register-page__benefit">
                <span aria-hidden="true">02</span>

                <div>
                  <strong>Discover compatible matches</strong>
                  <p>
                    Find relevant trucks or loads using transparent matching
                    criteria.
                  </p>
                </div>
              </div>

              <div className="register-page__benefit">
                <span aria-hidden="true">03</span>

                <div>
                  <strong>Work with greater visibility</strong>
                  <p>
                    Keep confirmations, activity and delivery progress in one
                    place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="register-page__company">
            Industrial Computing Engineering (Pty) Ltd
          </p>
        </div>
      </section>

      <section
        className="register-page__panel"
        aria-labelledby="register-title"
      >
        <div className="register-page__form-shell">
          <div className="register-page__mobile-brand">
            <div className="register-page__brand register-page__brand--dark">
              <span className="register-page__brand-mark" aria-hidden="true" />

              <span className="register-page__brand-copy">
                <strong>TAMP</strong>
                <small>
                  Truck Asset Matchmaking Platform by Industrial Computing
                  Engineering
                </small>
              </span>
            </div>
          </div>

          <header className="register-page__header">
            <p className="register-page__eyebrow">Get started</p>

            <h1 id="register-title">Create your account</h1>

            <p className="register-page__subtitle">
              Enter your organization and account details to join TAMP.
            </p>
          </header>

          {errors.general && (
            <div
              className="register-page__alert register-page__alert--error"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <form
            className="register-page__form"
            onSubmit={handleSubmit}
            noValidate
          >
            <fieldset
              className="register-page__role-fieldset"
              aria-describedby={errors.role ? "register-role-error" : undefined}
            >
              <legend>What type of account are you creating?</legend>

              <div className="register-page__role-grid">
                <label
                  className={`register-page__role-card ${
                    formData.role === "freight-owner"
                      ? "register-page__role-card--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="freight-owner"
                    checked={formData.role === "freight-owner"}
                    onChange={() => {
                      setFormData((current) => ({
                        ...current,
                        role: "freight-owner",
                      }));

                      clearError("role");
                    }}
                  />

                  <span className="register-page__role-content">
                    <span className="register-page__role-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M8 10h.01M12 10h.01M16 10h.01"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <span className="register-page__role-text">
                      <strong>Freight Owner</strong>
                      <small>
                        Post cargo loads and find suitable transport capacity.
                      </small>
                    </span>
                  </span>
                </label>

                <label
                  className={`register-page__role-card ${
                    formData.role === "transporter"
                      ? "register-page__role-card--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="transporter"
                    checked={formData.role === "transporter"}
                    onChange={() => {
                      setFormData((current) => ({
                        ...current,
                        role: "transporter",
                      }));

                      clearError("role");
                    }}
                  />

                  <span className="register-page__role-content">
                    <span className="register-page__role-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <span className="register-page__role-text">
                      <strong>Transporter</strong>
                      <small>
                        List available trucks and discover suitable loads.
                      </small>
                    </span>
                  </span>
                </label>
              </div>

              {errors.role && (
                <p
                  id="register-role-error"
                  className="register-page__field-error"
                  role="alert"
                >
                  {errors.role}
                </p>
              )}
            </fieldset>

            <div className="register-page__section-heading">
              <span>organization details</span>
            </div>

            <div className="register-page__form-grid">
              <div className="register-page__field register-page__field--full">
                <label htmlFor="organizationName">Organization name</label>

                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      organizationName: event.target.value,
                    }));

                    if (errors.organizationName) {
                      clearError("organizationName");
                    }
                  }}
                  placeholder="Kortes Talks Tech (Pty) Ltd"
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.organizationName)}
                  aria-describedby={
                    errors.organizationName ? "organization-error" : undefined
                  }
                />

                {errors.organizationName && (
                  <p
                    id="organization-error"
                    className="register-page__field-error"
                    role="alert"
                  >
                    {errors.organizationName}
                  </p>
                )}
              </div>

              <div className="register-page__field">
                <label htmlFor="fullName">Full name</label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }));

                    if (errors.fullName) {
                      clearError("fullName");
                    }
                  }}
                  placeholder="Lethabo Kgoele"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? "full-name-error" : undefined
                  }
                />

                {errors.fullName && (
                  <p
                    id="full-name-error"
                    className="register-page__field-error"
                    role="alert"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="register-page__field">
                <label htmlFor="phoneNumber">Phone number</label>

                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }));

                    if (errors.phoneNumber) {
                      clearError("phoneNumber");
                    }
                  }}
                  placeholder="+27 82 123 4567"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phoneNumber)}
                  aria-describedby={
                    errors.phoneNumber ? "phone-error" : undefined
                  }
                />

                {errors.phoneNumber && (
                  <p
                    id="phone-error"
                    className="register-page__field-error"
                    role="alert"
                  >
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="register-page__field register-page__field--full">
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
                  aria-describedby={
                    errors.email ? "register-email-error" : undefined
                  }
                />

                {errors.email && (
                  <p
                    id="register-email-error"
                    className="register-page__field-error"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="register-page__section-heading">
              <span>Secure your account</span>
            </div>

            <div className="register-page__form-grid">
              <div className="register-page__field">
                <label htmlFor="registerPassword">Password</label>

                <div className="register-page__password-field">
                  <input
                    id="registerPassword"
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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby="password-requirements"
                  />

                  <button
                    type="button"
                    className="register-page__password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
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
                  </button>
                </div>

                {errors.password && (
                  <p className="register-page__field-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="register-page__field">
                <label htmlFor="confirmPassword">Confirm password</label>

                <div className="register-page__password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }));

                      if (errors.confirmPassword) {
                        clearError("confirmPassword");
                      }
                    }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />

                  <button
                    type="button"
                    className="register-page__password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
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
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="register-page__field-error" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div
              id="password-requirements"
              className="register-page__password-requirements"
            >
              <span>Password requirements</span>
              <p>
                8–15 characters with at least one capital letter, one number and
                one symbol.
              </p>
            </div>

            <div className="register-page__terms">
              <label>
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      acceptTerms: event.target.checked,
                    }));

                    if (errors.acceptTerms) {
                      clearError("acceptTerms");
                    }
                  }}
                />

                <span>
                  I agree to the <strong>terms and conditions</strong>.
                </span>
              </label>

              {errors.acceptTerms && (
                <p className="register-page__field-error" role="alert">
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            <button
              className="register-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <footer className="register-page__signin">
            <p>
              Already have an account? <Link to={ROUTES.login}>Sign in</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
