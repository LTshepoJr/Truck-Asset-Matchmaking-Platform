import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

type UserRole = "freight-owner" | "transporter" | "admin";

interface LoginPageFormData {
  email: string;
  password: string;
  role: UserRole | "";
  rememberMe: boolean;
}

interface LoginPageFormErrors {
  email?: string;
  password?: string;
  role?: string;
  general?: string;
}

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  loggedInAt: string;
}

const roleRoutes: Record<UserRole, string> = {
  "freight-owner": "/freight-owner",
  transporter: "/transporter",
  admin: "/admin",
};

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginPageFormData>({
    email: "",
    password: "",
    role: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginPageFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): LoginPageFormErrors => {
    const newErrors: LoginPageFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.role) {
      newErrors.role = "Select your account role.";
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

    if (!formData.role) {
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * FRONT-END MVP LoginPage SIMULATION
       *
       * There is currently no production backend.
       * A valid form is treated as a successful LoginPage.
       *
       * This block can later be replaced with an authentication API call.
       */

      const session: UserSession = {
        id: crypto.randomUUID(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        loggedInAt: new Date().toISOString(),
      };

      const sessionData = JSON.stringify(session);

      if (formData.rememberMe) {
        localStorage.setItem("tamp-session", sessionData);
        sessionStorage.removeItem("tamp-session");
      } else {
        sessionStorage.setItem("tamp-session", sessionData);
        localStorage.removeItem("tamp-session");
      }

      navigate(roleRoutes[formData.role]);
    } catch {
      setErrors({
        general: "Unable to sign in. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section aria-labelledby="LoginPage-title">
        <header>
          <p>Truck Asset Matchmaking Platform</p>
          <h1 id="LoginPage-title">Sign in</h1>
          <p>Access your TAMP account.</p>
        </header>

        {errors.general && (
          <div role="alert">
            <p>{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
                  setErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }
              }}
              placeholder="ICE@icloud.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />

            {errors.email && (
              <p id="email-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password">Password</label>

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
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>

            {errors.password && (
              <p id="password-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role">Account role</label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(event) => {
                const role = event.target.value as UserRole | "";

                setFormData((current) => ({
                  ...current,
                  role,
                }));

                if (errors.role) {
                  setErrors((current) => ({
                    ...current,
                    role: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "role-error" : undefined}
            >
              <option value="">Select a role</option>
              <option value="freight-owner">Freight Owner</option>
              <option value="transporter">Transporter</option>
              <option value="admin">Administrator</option>
            </select>

            {errors.role && (
              <p id="role-error" role="alert">
                {errors.role}
              </p>
            )}
          </div>

          <div>
            <label>
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
              Remember me
            </label>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <footer>
          <p>
            Do not have an account?{" "}
            <Link to="/register">Create an account</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;
