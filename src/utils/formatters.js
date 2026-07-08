/**
 * Formatting Utilities
 * Currency, date, and ID formatting for consistent display across the portal.
 */

/**
 * Formats a numeric amount as a localized currency string.
 * @param {number} amount - The numeric amount to format.
 * @param {string} [currency='INR'] - Currency code: 'INR', 'USD', or 'JPY'.
 * @returns {string} Formatted string, e.g. '₹1,500', '$70', '¥10,000'.
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null || isNaN(amount)) return '—';

  const config = {
    INR: { locale: 'en-IN', symbol: '₹' },
    USD: { locale: 'en-US', symbol: '$' },
    JPY: { locale: 'ja-JP', symbol: '¥' },
  };

  const { locale, symbol } = config[currency] || config.INR;

  // JPY has no decimal places; INR and USD show decimals only if fractional
  const maximumFractionDigits = currency === 'JPY' ? 0 : 2;
  const minimumFractionDigits = 0;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return `${symbol}${formatted}`;
};

/**
 * Formats an ISO date string into a human-readable format.
 * @param {string} isoDate - ISO date string (e.g. '2025-06-15' or '2025-06-15T09:30:00.000Z').
 * @returns {string} Formatted date, e.g. '15 Jun 2025'.
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '—';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Ensures consistent display of GHR IDs (always an 8-digit string).
 * @param {string|number} id - GHR ID to format.
 * @returns {string} Formatted GHR ID, e.g. '40261873'.
 */
export const formatGhrId = (id) => {
  if (id == null) return '—';
  return String(id).padStart(8, '0');
};
