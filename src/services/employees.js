/**
 * Employee Service
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD operations for employee records. All reads/writes go through
 * localStorage (prefixed with 'sem_'). Seed data is loaded on first access.
 *
 * Password fields are NEVER exposed through this service.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import seedEmployees from '../data/employees.json';

const STORAGE_KEY = 'sem_employees';

/**
 * Initialises the employee store from seed data if localStorage is empty.
 * @returns {Array} Complete employee records (including password — internal only).
 */
const loadStore = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEmployees));
  return [...seedEmployees];
};

/**
 * Persists the employee array to localStorage.
 * @param {Array} employees - The full employee array.
 */
const persistStore = (employees) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
};

/**
 * Strips the password field from an employee record.
 * @param {object} emp - Raw employee record.
 * @returns {object} Employee without password.
 */
const sanitise = (emp) => {
  if (!emp) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = emp;
  return safe;
};

/**
 * Retrieves a single employee by GHR ID.
 *
 * @param {string} ghrId - The employee's GHR ID.
 * @returns {Promise<object|null>} Employee object (without password), or null if not found.
 */
export const getEmployeeByGhrId = async (ghrId) => {
  const employees = loadStore();
  const normalizedId = String(ghrId).trim();
  const employee = employees.find((emp) => emp.ghrId === normalizedId);
  return sanitise(employee);
};

/**
 * Retrieves all employees.
 *
 * @returns {Promise<Array<object>>} Array of employee objects (without password fields).
 */
export const getAllEmployees = async () => {
  const employees = loadStore();
  return employees.map(sanitise);
};

/**
 * Creates or updates an employee.
 * - If an employee with the given ghrId exists → update (merge fields).
 * - If no match → create a new record.
 *
 * @param {object} emp - Employee data. Must include `ghrId`.
 * @returns {Promise<object>} The saved employee object (without password).
 */
export const saveEmployee = async (emp) => {
  if (!emp || !emp.ghrId) {
    throw new Error('Employee ghrId is required.');
  }

  const employees = loadStore();
  const normalizedId = String(emp.ghrId).trim();
  const existingIndex = employees.findIndex((e) => e.ghrId === normalizedId);

  if (existingIndex >= 0) {
    // Update — merge new fields into existing record
    employees[existingIndex] = { ...employees[existingIndex], ...emp, ghrId: normalizedId };
  } else {
    // Create — add new employee with a default password if not provided
    // MOCK ONLY — plaintext password for local dev validation.
    // Real backend stores bcrypt hash; this field never exists in production API responses.
    const newEmployee = {
      ...emp,
      ghrId: normalizedId,
      password: emp.password || 'Samsung@2024',
    };
    employees.push(newEmployee);
  }

  persistStore(employees);

  const saved = employees.find((e) => e.ghrId === normalizedId);
  return sanitise(saved);
};

/**
 * Deletes an employee by GHR ID.
 *
 * @param {string} ghrId - The GHR ID of the employee to remove.
 * @returns {Promise<boolean>} True if an employee was deleted, false if not found.
 */
export const deleteEmployee = async (ghrId) => {
  const employees = loadStore();
  const normalizedId = String(ghrId).trim();
  const initialLength = employees.length;
  const filtered = employees.filter((emp) => emp.ghrId !== normalizedId);

  if (filtered.length === initialLength) {
    return false; // nothing was removed
  }

  persistStore(filtered);
  return true;
};
