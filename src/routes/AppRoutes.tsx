import { Navigate, Route, Routes } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import { RoleLayout } from "../layouts/RoleLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import LoginPage from "../pages/auth/LoginPage";
import { FreightOwnerDashboardPage } from "../pages/freight-owner/FreightOwnerDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TransporterDashboardPage } from "../pages/transporter/TransporterDashboardPage";
import { TransporterTrucksPage } from "../pages/transporter/TransporterTrucksPage";
import { CreateTruckPage } from "../pages/transporter/CreateTruckPage";
import { TransporterMatchesPage } from "../pages/transporter/TransporterMatchesPage";
import { TransporterReceiptPage } from "../pages/transporter/TransporterReceiptPage";
import { ROUTES } from "./paths";
import { ProtectedRoute } from "./ProtectedRoute";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import { CreateLoadPage } from "../pages/freight-owner/CreateLoadPage";
import { FreightOwnerLoadsPage } from "../pages/freight-owner/FreightOwnerLoadsPage";
import { FreightOwnerMatchesPage } from "../pages/freight-owner/FreightOwnerMatchesPage";
import { FreightOwnerReceiptPage } from "../pages/freight-owner/FreightOwnerReceiptPage";
import { FreightOwnerTrackingPage } from "../pages/freight-owner/FreightOwnerTrackingPage";
import { FreightOwnerRatingsPage } from "../pages/freight-owner/FreightOwnerRatingsPage";
import { FreightOwnerSettingsPage } from "../pages/freight-owner/FreightOwnerSettingsPage";

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
  {
    label: "Ratings",
    to: ROUTES.freightOwnerRatings,
  },
];

const transporterNavigation = [
  {
    label: "Dashboard",
    to: ROUTES.transporter,
  },
  {
    label: "My Trucks",
    to: ROUTES.transporterTrucks,
  },
  {
    label: "Post Truck",
    to: ROUTES.transporterNewTruck,
  },
  {
    label: "Matches",
    to: ROUTES.transporterMatches,
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
          <Route path="ratings" element={<FreightOwnerRatingsPage />} />
          <Route path="settings" element={<FreightOwnerSettingsPage />} />
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
          <Route path="trucks" element={<TransporterTrucksPage />} />
          <Route path="trucks/new" element={<CreateTruckPage />} />
          <Route path="trucks/:truckId/edit" element={<CreateTruckPage />} />
          <Route path="matches" element={<TransporterMatchesPage />} />
          <Route
            path="receipts/:matchId"
            element={<TransporterReceiptPage />}
          />
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
