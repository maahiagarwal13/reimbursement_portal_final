/**
 * Date Helper Utilities
 * Tenure calculations, date comparisons, and day-counting for the reimbursement portal.
 */

/**
 * Calculates the tenure in fractional years from a joining date to today.
 * @param {string} joiningDate - ISO date string (e.g. '2019-03-15').
 * @returns {number} Tenure in years (fractional).
 */
export const calculateTenure = (joiningDate) => {
  const start = new Date(joiningDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  return diffMs / msPerYear;
};

/**
 * Checks whether an employee has over 5 years of tenure.
 * @param {string} joiningDate - ISO date string.
 * @returns {boolean} True if tenure exceeds 5 years.
 */
export const isOver5Years = (joiningDate) => {
  return calculateTenure(joiningDate) >= 5;
};

/**
 * Returns the tenure band for CL3 rate lookups.
 * @param {string} joiningDate - ISO date string.
 * @returns {'over5' | 'under5'} The tenure band key.
 */
export const getTenureBand = (joiningDate) => {
  return isOver5Years(joiningDate) ? 'over5' : 'under5';
};

/**
 * Checks whether the given end date has already passed.
 * @param {string} endDate - ISO date string.
 * @returns {boolean} True if the end date is in the past.
 */
export const hasEndDatePassed = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  // Compare dates only (ignore time component)
  end.setHours(23, 59, 59, 999);
  return end.getTime() < now.getTime();
};

/**
 * Calculates the number of days between two dates (inclusive).
 * Both start and end dates count as full days.
 * @param {string} start - ISO date string for the start date.
 * @param {string} end - ISO date string for the end date.
 * @returns {number} Number of days (inclusive).
 */
export const getDaysBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  // +1 for inclusive counting (both start and end day count)
  return Math.floor(diffMs / msPerDay) + 1;
};
