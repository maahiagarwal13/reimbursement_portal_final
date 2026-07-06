/**
 * REST API Endpoint Constants
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised path definitions for every API route the portal will consume.
 * Path parameters use {param} placeholders — the httpClient or service layer
 * should interpolate them before making a request.
 *
 * IMPORTANT: No component or page should ever import this file directly.
 * Only service-layer modules should reference these endpoints.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────────────────────
  LOGIN: '/api/auth/login',

  // ── Employees ───────────────────────────────────────────────────────────
  GET_EMPLOYEE: '/api/employees/{ghrId}',
  GET_ALL_EMPLOYEES: '/api/employees',
  SAVE_EMPLOYEE: '/api/employees',
  UPDATE_EMPLOYEE: '/api/employees/{ghrId}',
  DELETE_EMPLOYEE: '/api/employees/{ghrId}',

  // ── Reimbursement Requests ──────────────────────────────────────────────
  GET_ALL_REQUESTS: '/api/requests',
  GET_REQUESTS_BY_EMPLOYEE: '/api/requests/employee/{ghrId}',
  GET_REQUEST_BY_ID: '/api/requests/{id}',
  CREATE_TRAVEL_PRE_APPROVAL: '/api/requests/travel/pre-approval',
  SUBMIT_SETTLEMENT: '/api/requests/{id}/settlement',
  CREATE_INTERNET_REQUEST: '/api/requests/internet',
  CREATE_CARPOOL_REQUEST: '/api/requests/carpool',
  CREATE_RELOCATION_REQUEST: '/api/requests/relocation',
  FINANCE_REVIEW: '/api/requests/{id}/review',

  // ── Admin — Rate Configuration ─────────────────────────────────────────
  GET_RATE_CONFIG: '/api/admin/rate-config/{category}',
  SAVE_RATE_CONFIG: '/api/admin/rate-config/{category}',
  GET_DOMESTIC_CITY_TIERS: '/api/admin/city-tiers',
  SAVE_DOMESTIC_CITY_TIERS: '/api/admin/city-tiers',
  GET_INTL_COUNTRY_TIERS: '/api/admin/country-tiers',
  SAVE_INTL_COUNTRY_TIERS: '/api/admin/country-tiers',

  // ── Dashboards ──────────────────────────────────────────────────────────
  GET_EMPLOYEE_DASHBOARD_STATS: '/api/dashboard/employee/{ghrId}',
  GET_FINANCE_DASHBOARD_STATS: '/api/dashboard/finance',
  GET_ADMIN_DASHBOARD_STATS: '/api/dashboard/admin',
};
