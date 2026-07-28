import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    <main>
      <section aria-labelledby="register-title">
        <header>
          <p>Create your TAMP account</p>

          <h1 id="register-title">Register</h1>

          <p>
            Create an account to start using the Truck Asset Matchmaking
            Platform.
          </p>
        </header>

        {errors.general && (
          <div role="alert">
            <p>{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset>
            <legend>Account type</legend>

            <label>
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
              Freight Owner
            </label>

            <label>
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
              Transporter
            </label>

            {errors.role && <p role="alert">{errors.role}</p>}
          </fieldset>

          <div>
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
              autoComplete="organization"
              aria-invalid={Boolean(errors.organizationName)}
              aria-describedby={
                errors.organizationName ? "organization-error" : undefined
              }
            />

            {errors.organizationName && (
              <p id="organization-error" role="alert">
                {errors.organizationName}
              </p>
            )}
          </div>

          <div>
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
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "full-name-error" : undefined}
            />

            {errors.fullName && (
              <p id="full-name-error" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
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
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />

            {errors.email && (
              <p id="register-email-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div>
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
              autoComplete="tel"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? "phone-error" : undefined}
            />

            {errors.phoneNumber && (
              <p id="phone-error" role="alert">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="registerPassword">Password</label>

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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-requirements"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"} password
            </button>

            <p id="password-requirements">
              Password must be 8–15 characters and contain at least one capital
              letter, one number and one symbol.
            </p>

            {errors.password && <p role="alert">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm password</label>

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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? "Hide" : "Show"} password
            </button>

            {errors.confirmPassword && (
              <p role="alert">{errors.confirmPassword}</p>
            )}
          </div>

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
            I agree to the terms and conditions.
          </label>

          {errors.acceptTerms && <p role="alert">{errors.acceptTerms}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <footer>
          <p>
            Already have an account? <Link to={ROUTES.login}>Sign in</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

export default RegisterPage;
