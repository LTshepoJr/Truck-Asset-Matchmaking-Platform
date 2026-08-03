import { Navigate, Route, Routes } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import { RoleLayout } from "../layouts/RoleLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import LoginPage from "../pages/auth/LoginPage";
import { FreightOwnerDashboardPage } from "../pages/freight-owner/FreightOwnerDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TransporterDashboardPage } from "../pages/transporter/TransporterDashboardPage";
import { ROUTES } from "./paths";
import { ProtectedRoute } from "./ProtectedRoute";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import { CreateLoadPage } from "../pages/freight-owner/CreateLoadPage";
import { FreightOwnerLoadsPage } from "../pages/freight-owner/FreightOwnerLoadsPage";
import { FreightOwnerMatchesPage } from "../pages/freight-owner/FreightOwnerMatchesPage";
import { FreightOwnerReceiptPage } from "../pages/freight-owner/FreightOwnerReceiptPage";
import { FreightOwnerTrackingPage } from "../pages/freight-owner/FreightOwnerTrackingPage";

const freightOwnerNavigation = [
  {
    label: "Dashboard",
    to: ROUTES.freightOwner,
  },
  {
    label: "My Loads",
    to: ROUTES.freightOwnerLoads,
  },
  {
    label: "Post Load",
    to: ROUTES.freightOwnerNewLoad,
  },
  {
    label: "Matches",
    to: ROUTES.freightOwnerMatches,
  },
  {
    label: "Tracking",
    to: ROUTES.freightOwnerTracking,
  },
];

const transporterNavigation = [
  {
    label: "Dashboard",
    to: ROUTES.transporter,
  },
];

const adminNavigation = [
  {
    label: "Dashboard",
    to: ROUTES.admin,
  },
];

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.home}
        element={<Navigate to={ROUTES.login} replace />}
      />
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />

      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />

      {/* Freight Owner routes */}
      <Route element={<ProtectedRoute requiredRole="freight-owner" />}>
        <Route
          path={ROUTES.freightOwner}
          element={
            <RoleLayout
              roleName="Freight Owner"
              navigation={freightOwnerNavigation}
            />
          }
        >
          <Route index element={<FreightOwnerDashboardPage />} />

          <Route path="loads" element={<FreightOwnerLoadsPage />} />

          <Route path="loads/new" element={<CreateLoadPage />} />

          <Route path="matches" element={<FreightOwnerMatchesPage />} />

          <Route
            path="receipts/:matchId"
            element={<FreightOwnerReceiptPage />}
          />

          <Route path="tracking" element={<FreightOwnerTrackingPage />} />
        </Route>
      </Route>

      {/* Transporter routes */}
      <Route element={<ProtectedRoute requiredRole="transporter" />}>
        <Route
          path={ROUTES.transporter}
          element={
            <RoleLayout
              roleName="Transporter"
              navigation={transporterNavigation}
            />
          }
        >
          <Route index element={<TransporterDashboardPage />} />
        </Route>
      </Route>

      {/* Administrator routes */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route
          path={ROUTES.admin}
          element={
            <RoleLayout roleName="Administrator" navigation={adminNavigation} />
          }
        >
          <Route index element={<AdminDashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
