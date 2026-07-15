import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

/* Base Layout shell */
import BaseLayout from './components/Layout/BaseLayout';
import GlobalLoader from './components/shared/GlobalLoader';

/* Pages */
import Login from './pages/Login';

/* Employee pages (Base Experience) */
import Dashboard from './pages/employee/Dashboard';
import NewRequest from './pages/employee/NewRequest';
import MyRequests from './pages/employee/MyRequests';
import PolicyLimits from './pages/employee/PolicyLimits';
import Internet from './pages/employee/Internet';
import Carpool from './pages/employee/Carpool';
import Relocation from './pages/employee/Relocation';
import MyVault from './pages/employee/MyVault';

/* Travel pages */
import PreApproval from './pages/travel/PreApproval';
import Settlement from './pages/travel/Settlement';
import ViewRequest from './pages/travel/ViewRequest';
import ExtendTrip from './pages/travel/ExtendTrip';

/* Finance pages (Extra access) */
import FinanceDashboard from './pages/finance/FinanceDashboard';
import FinanceRequests from './pages/finance/FinanceRequests';
import FinanceReview from './pages/finance/FinanceReview';
import VehicleKYCApprovals from './pages/finance/VehicleKYCApprovals';

/* Admin pages (Extra access) */
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminDomesticRates from './pages/admin/AdminDomesticRates';
import AdminIntlRates from './pages/admin/AdminIntlRates';
import AdminRelocationCaps from './pages/admin/AdminRelocationCaps';
import AdminCarpoolConfig from './pages/admin/AdminCarpoolConfig';
import AdminInternetCaps from './pages/admin/AdminInternetCaps';

/**
 * Route guard — redirects to /login if not authenticated,
 * or blocks access if the user lacks the required permission flag.
 */
function RequireAuth({ children, requiredFlag }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific flag is required, check it
  if (requiredFlag && !user[requiredFlag]) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Redirect authenticated users away from /login to the base dashboard.
 */
function RedirectIfAuth({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GlobalLoader />
        <Routes>
          {/* Public */}
      <Route
        path="/login"
        element={
          <RedirectIfAuth>
            <Login />
          </RedirectIfAuth>
        }
      />

      {/* Unified App Shell */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <BaseLayout />
          </RequireAuth>
        }
      >
        {/* Base Experience (Everyone gets this) */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="new-request/travel" element={<PreApproval />} />
        <Route path="new-request/internet" element={<Internet />} />
        <Route path="new-request/carpool" element={<Carpool />} />
        <Route path="new-request/relocation" element={<Relocation />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="requests/:id" element={<ViewRequest />} />
        <Route path="requests/:id/settlement" element={<Settlement />} />
        <Route path="new-request/travel/extend/:id" element={<ExtendTrip />} />
        <Route path="policy" element={<PolicyLimits />} />
        <Route path="my-vault" element={<MyVault />} />

        {/* Finance Access Group */}
        <Route
          path="finance/dashboard"
          element={
            <RequireAuth requiredFlag="hasFinanceAccess">
              <FinanceDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="finance/requests"
          element={
            <RequireAuth requiredFlag="hasFinanceAccess">
              <FinanceRequests />
            </RequireAuth>
          }
        />
        <Route
          path="finance/requests/:id"
          element={
            <RequireAuth requiredFlag="hasFinanceAccess">
              <FinanceReview />
            </RequireAuth>
          }
        />
        <Route
          path="finance/kyc-approvals"
          element={
            <RequireAuth requiredFlag="hasFinanceAccess">
              <VehicleKYCApprovals />
            </RequireAuth>
          }
        />

        {/* Admin Access Group */}
        <Route
          path="admin/dashboard"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="admin/employees"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminEmployees />
            </RequireAuth>
          }
        />
        <Route
          path="admin/policy/domestic"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminDomesticRates />
            </RequireAuth>
          }
        />
        <Route
          path="admin/policy/international"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminIntlRates />
            </RequireAuth>
          }
        />
        <Route
          path="admin/policy/relocation"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminRelocationCaps />
            </RequireAuth>
          }
        />
        <Route
          path="admin/policy/carpooling"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminCarpoolConfig />
            </RequireAuth>
          }
        />
        <Route
          path="admin/policy/internet"
          element={
            <RequireAuth requiredFlag="hasAdminAccess">
              <AdminInternetCaps />
            </RequireAuth>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  );
}
