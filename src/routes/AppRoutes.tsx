import { Navigate, Route, Routes } from "react-router-dom";

import { RoleLayout } from "../layouts/RoleLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import Login from "../pages/auth/LoginPage";
import { FreightOwnerDashboardPage } from "../pages/freight-owner/FreightOwnerDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TransporterDashboardPage } from "../pages/transporter/TransporterDashboardPage";
import { ROUTES } from "./paths";

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

      <Route path={ROUTES.login} element={<Login />} />

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

      <Route
        path={ROUTES.admin}
        element={
          <RoleLayout roleName="Administrator" navigation={adminNavigation} />
        }
      >
        <Route index element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
