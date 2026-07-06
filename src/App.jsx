import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

/* Layout shells */
import EmployeeLayout from './components/Layout/EmployeeLayout';
import FinanceLayout from './components/Layout/FinanceLayout';
import AdminLayout from './components/Layout/AdminLayout';

/* Pages */
import Login from './pages/Login';

/* Employee pages */
import Dashboard from './pages/employee/Dashboard';
import NewRequest from './pages/employee/NewRequest';
import MyRequests from './pages/employee/MyRequests';
import PolicyLimits from './pages/employee/PolicyLimits';

/* Travel pages */
import PreApproval from './pages/travel/PreApproval';
import Settlement from './pages/travel/Settlement';
import ViewRequest from './pages/travel/ViewRequest';

/* Finance pages */
import FinanceDashboard from './pages/finance/FinanceDashboard';
import FinanceRequests from './pages/finance/FinanceRequests';
import FinanceReview from './pages/finance/FinanceReview';

/* Admin pages */
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminDomesticRates from './pages/admin/AdminDomesticRates';
import AdminIntlRates from './pages/admin/AdminIntlRates';
import AdminRelocationCaps from './pages/admin/AdminRelocationCaps';
import AdminCarpoolConfig from './pages/admin/AdminCarpoolConfig';
import AdminInternetCaps from './pages/admin/AdminInternetCaps';

/**
 * Route guard — redirects to /login if not authenticated,
 * or to the correct role dashboard if accessing a mismatched shell.
 */
function RequireAuth({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardMap = {
      employee: '/employee/dashboard',
      finance: '/finance/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return children;
}

/**
 * Redirect authenticated users away from /login to their role dashboard.
 */
function RedirectIfAuth({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    const dashboardMap = {
      employee: '/employee/dashboard',
      finance: '/finance/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/employee/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
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

      {/* Employee shell */}
      <Route
        path="/employee"
        element={
          <RequireAuth allowedRoles={['employee']}>
            <EmployeeLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-request" element={<NewRequest />} />
        <Route path="new-request/travel" element={<PreApproval />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="requests/:id" element={<ViewRequest />} />
        <Route path="requests/:id/settlement" element={<Settlement />} />
        <Route path="policy" element={<PolicyLimits />} />
      </Route>

      {/* Finance shell */}
      <Route
        path="/finance"
        element={
          <RequireAuth allowedRoles={['finance', 'admin']}>
            <FinanceLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FinanceDashboard />} />
        <Route path="requests" element={<FinanceRequests />} />
        <Route path="requests/:id" element={<FinanceReview />} />
      </Route>

      {/* Admin shell */}
      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="rates/domestic" element={<AdminDomesticRates />} />
        <Route path="rates/international" element={<AdminIntlRates />} />
        <Route path="rates/relocation" element={<AdminRelocationCaps />} />
        <Route path="rates/carpool" element={<AdminCarpoolConfig />} />
        <Route path="rates/internet" element={<AdminInternetCaps />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
