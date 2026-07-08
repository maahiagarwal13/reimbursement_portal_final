/**
 * Dashboard Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates statistics for employee, finance, and admin dashboards.
 * Reads from the same localStorage stores as other services.
 *
 * All localStorage access is encapsulated — no component reads 'sem_*' keys.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import seedRequests from '../data/sampleRequests.json';
import seedEmployees from '../data/employees.json';
import seedRateConfig from '../data/rateConfig.json';

const REQUESTS_KEY = 'sem_requests';
const EMPLOYEES_KEY = 'sem_employees';
const RATE_CONFIG_KEY = 'sem_rateConfig';

const loadRequests = () => {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(seedRequests));
  return [...seedRequests];
};

const loadEmployees = () => {
  const stored = localStorage.getItem(EMPLOYEES_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(seedEmployees));
  return [...seedEmployees];
};

const loadRateConfig = () => {
  const stored = localStorage.getItem(RATE_CONFIG_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(RATE_CONFIG_KEY, JSON.stringify(seedRateConfig));
  return { ...seedRateConfig };
};

/**
 * Determines the effective status of a request for aggregation purposes.
 * A request can be pending at pre-approval stage or settlement stage.
 * @param {object} request
 * @returns {'pending' | 'approved' | 'rejected'}
 */
const getEffectiveStatus = (request) => {
  if (request.stage === 'pre-approval') {
    return request.preApprovalStatus || 'pending';
  }
  return request.settlementStatus || 'pending';
};

/**
 * Extracts the approved reimbursable amount from a request.
 * Only counts requests with an approved settlement status.
 * @param {object} request
 * @returns {number} Reimbursed amount (0 if not approved).
 */
const getApprovedAmount = (request) => {
  const status = getEffectiveStatus(request);
  if (status !== 'approved' || !request.settlement) return 0;

  // Different request types store the reimbursable amount in different fields
  if (request.settlement.totalReimbursable != null) {
    return request.settlement.totalReimbursable;
  }
  if (request.settlement.approvedAmount != null) {
    return request.settlement.approvedAmount;
  }
  if (request.settlement.reimbursable != null) {
    return request.settlement.reimbursable;
  }
  return 0;
};

/**
 * Returns dashboard statistics for a specific employee.
 *
 * @param {string} ghrId - Employee GHR ID.
 * @returns {Promise<object>} Stats including counts and total reimbursed.
 */
export const getEmployeeDashboardStats = async (ghrId) => {
  const requests = loadRequests();
  const normalizedId = String(ghrId).trim();
  const myRequests = requests.filter((r) => r.ghrId === normalizedId);

  const total = myRequests.length;
  const pending = myRequests.filter(
    (r) => getEffectiveStatus(r) === 'pending'
  ).length;
  const approved = myRequests.filter(
    (r) => getEffectiveStatus(r) === 'approved'
  ).length;
  const rejected = myRequests.filter(
    (r) => getEffectiveStatus(r) === 'rejected'
  ).length;
  const totalReimbursed = myRequests.reduce(
    (sum, r) => sum + getApprovedAmount(r),
    0
  );

  // Breakdown by request type
  const byType = myRequests.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    pending,
    approved,
    rejected,
    totalReimbursed,
    byType,
  };
};

/**
 * Returns dashboard statistics for the finance team.
 * Includes aggregate counts across ALL requests and a pending-reviews count.
 *
 * @returns {Promise<object>} Finance dashboard stats.
 */
export const getFinanceDashboardStats = async () => {
  const requests = loadRequests();

  const total = requests.length;
  const pending = requests.filter(
    (r) => getEffectiveStatus(r) === 'pending'
  ).length;
  const approved = requests.filter(
    (r) => getEffectiveStatus(r) === 'approved'
  ).length;
  const rejected = requests.filter(
    (r) => getEffectiveStatus(r) === 'rejected'
  ).length;

  // Pending reviews = requests that finance can currently act on
  // (pre-approval pending or settlement pending)
  const pendingReviews = requests.filter(
    (r) =>
      (r.stage === 'pre-approval' && r.preApprovalStatus === 'pending') ||
      (r.stage !== 'pre-approval' && r.settlementStatus === 'pending')
  ).length;

  const totalReimbursed = requests.reduce(
    (sum, r) => sum + getApprovedAmount(r),
    0
  );

  // Breakdown by type
  const byType = requests.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  // Breakdown by status
  const byStatus = { pending, approved, rejected };

  return {
    total,
    pending,
    approved,
    rejected,
    pendingReviews,
    totalReimbursed,
    byType,
    byStatus,
  };
};

/**
 * Returns dashboard statistics for the admin view.
 * Includes employee count, active policy count (rate config categories),
 * and monthly request volume.
 *
 * @returns {Promise<object>} Admin dashboard stats.
 */
export const getAdminDashboardStats = async () => {
  const employees = loadEmployees();
  const requests = loadRequests();
  const rateConfig = loadRateConfig();

  // Employee count (excluding password-only sanity — count all records)
  const employeeCount = employees.length;

  // Active policy count = number of rate configuration categories
  const activePolicyCount = Object.keys(rateConfig).length;

  // Monthly request volume — count for current month
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyVolume = requests.filter(r => r.submittedAt && r.submittedAt.startsWith(currentMonth)).length;

  // Breakdown by access flag
  const byAccess = {
    admin: employees.filter(e => e.hasAdminAccess).length,
    finance: employees.filter(e => e.hasFinanceAccess && !e.hasAdminAccess).length,
    standard: employees.filter(e => !e.hasAdminAccess && !e.hasFinanceAccess).length,
  };

  // Department breakdown
  const byDepartment = employees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});

  return {
    employeeCount,
    activePolicyCount,
    monthlyVolume,
    byAccess,
    byDepartment,
    totalRequests: requests.length,
  };
};
