import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getCurrentSession, type UserRole } from "../services/authService";

import { ROUTES } from "./paths";

interface ProtectedRouteProps {
  requiredRole: UserRole;
}

const roleRoutes: Record<UserRole, string> = {
  "freight-owner": ROUTES.freightOwner,
  transporter: ROUTES.transporter,
  admin: ROUTES.admin,
};

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const location = useLocation();

  const session = getCurrentSession();

  /*
   * No authenticated session:
   * send the user back to the login page.
   */
  if (!session) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
   * The user is authenticated but is trying
   * to access another role's area.
   *
   * Redirect them to their own dashboard.
   */
  if (session.role !== requiredRole) {
    return <Navigate to={roleRoutes[session.role]} replace />;
  }

  /*
   * Authentication and role are valid.
   * Render the protected child route.
   */
  return <Outlet />;
}
