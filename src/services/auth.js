/**
 * Authentication Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Mock authentication that validates against employee seed data.
 * Uses sessionStorage for token/session persistence within a browser tab.
 *
 * IMPORTANT: All localStorage/sessionStorage access is encapsulated here —
 * no component should read storage directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import seedEmployees from '../data/employees.json';

const SESSION_USER_KEY = 'sem_currentUser';
const SESSION_TOKEN_KEY = 'sem_authToken';

/**
 * Retrieves the employee list from localStorage (or seed data on first load).
 * @returns {Array} Employee records including password field.
 */
const getEmployeeStore = () => {
  const stored = localStorage.getItem('sem_employees');
  if (stored) {
    return JSON.parse(stored);
  }
  // First load — initialise localStorage from seed data
  localStorage.setItem('sem_employees', JSON.stringify(seedEmployees));
  return seedEmployees;
};

/**
 * Generates a fabricated JWT-like token string for mock auth.
 * NOT a real JWT — just a Base64-encoded JSON payload for dev purposes.
 * @param {object} employee - The authenticated employee record.
 * @returns {string} Fabricated token string.
 */
const fabricateToken = (employee) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: employee.ghrId,
      name: employee.name,
      role: employee.role,
      cl: employee.cl,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8-hour expiry
    })
  );
  const signature = btoa('mock-signature-not-cryptographic');
  return `${header}.${payload}.${signature}`;
};

/**
 * Strips the password field from an employee record before exposing it.
 * @param {object} emp - Raw employee record.
 * @returns {object} Employee record without the password field.
 */
const sanitiseEmployee = (emp) => {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = emp;
  return safe;
};

/**
 * Authenticates an employee by GHR ID and password.
 *
 * @param {string} ghrId - The employee's GHR ID.
 * @param {string} password - The employee's password.
 * @returns {Promise<{ employee: object, token: string }>} Authenticated session.
 * @throws {Error} If credentials are invalid.
 */
export const login = async (ghrId, password) => {
  const employees = getEmployeeStore();
  const normalizedId = String(ghrId).trim();

  const employee = employees.find((emp) => emp.ghrId === normalizedId);

  if (!employee) {
    const error = new Error('Invalid GHR ID. No employee found with this identifier.');
    error.code = 'AUTH_USER_NOT_FOUND';
    throw error;
  }

  // MOCK ONLY — plaintext password for local dev validation.
  // Real backend stores bcrypt hash; this field never exists in production API responses.
  if (employee.password !== password) {
    const error = new Error('Incorrect password. Please try again.');
    error.code = 'AUTH_INVALID_PASSWORD';
    throw error;
  }

  const safeEmployee = sanitiseEmployee(employee);
  const token = fabricateToken(employee);

  // Persist session in sessionStorage (tab-scoped)
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeEmployee));
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);

  return { employee: safeEmployee, token };
};

/**
 * Clears the current session, effectively logging the user out.
 * @returns {Promise<void>}
 */
export const logout = async () => {
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
};

/**
 * Returns the currently logged-in user, or null if no session exists.
 * @returns {Promise<object|null>} Employee record (without password) or null.
 */
export const getCurrentUser = async () => {
  const stored = sessionStorage.getItem(SESSION_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

/**
 * Returns the current authentication token, or null if not logged in.
 * @returns {Promise<string|null>} Token string or null.
 */
export const getToken = async () => {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || null;
};
