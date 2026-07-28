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

const freightOwnerNavigation = [
  {
    label: "Dashboard",
    to: ROUTES.freightOwner,
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
