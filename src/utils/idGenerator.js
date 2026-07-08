/**
 * ID Generator Utility
 * Generates UUID-like identifiers for reimbursement request records.
 */

/**
 * Generates a UUID-like string for request IDs.
 * Format: REQ-YYYY-XXXX-XXXX where X is a random hex character.
 * @returns {string} A unique request identifier.
 */
export const generateId = () => {
  const year = new Date().getFullYear();
  const hexSegment = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');

  return `REQ-${year}-${hexSegment()}-${hexSegment()}`;
};
