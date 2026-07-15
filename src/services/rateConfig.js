/**
 * Rate Configuration Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads and persists rate configs, domestic city tiers, and international
 * country tiers. On first load, initialises localStorage from seed data.
 *
 * All localStorage access is encapsulated here — no component should read
 * storage keys directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import seedRateConfig from '../data/rateConfig.json';
import seedCityTiers from '../data/domesticCityTiers.json';
import seedCountryTiers from '../data/intlCountryTiers.json';

const RATE_CONFIG_KEY = 'sem_rateConfig';
const CITY_TIERS_KEY = 'sem_cityTiers';
const COUNTRY_TIERS_KEY = 'sem_countryTiers';

// ── Initialisation helpers ────────────────────────────────────────────────

/**
 * Loads the full rate configuration object, seeding from JSON on first access.
 * @returns {object} The complete rate configuration.
 */
const loadRateConfig = () => {
  const stored = localStorage.getItem(RATE_CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.domesticPerDiem) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse rate config', e);
    }
  }
  localStorage.setItem(RATE_CONFIG_KEY, JSON.stringify(seedRateConfig));
  return { ...seedRateConfig };
};

/**
 * Loads domestic city tiers, seeding from JSON on first access.
 * @returns {Array<{ cityName: string, tier: string }>}
 */
const loadCityTiers = () => {
  const stored = localStorage.getItem(CITY_TIERS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(CITY_TIERS_KEY, JSON.stringify(seedCityTiers));
  return [...seedCityTiers];
};

/**
 * Loads international country tiers, seeding from JSON on first access.
 * @returns {Array<{ countryOrCity: string, tier: string }>}
 */
const loadCountryTiers = () => {
  const stored = localStorage.getItem(COUNTRY_TIERS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(COUNTRY_TIERS_KEY, JSON.stringify(seedCountryTiers));
  return [...seedCountryTiers];
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the rate configuration for a specific category.
 *
 * @param {string} category - Config category key (e.g. 'domesticPerDiem',
 *   'intlHotel', 'carpoolOwnFuelRate', etc.).
 * @returns {Promise<object|null>} The category config object, or null if not found.
 */
export const getRateConfig = async (category) => {
  const config = loadRateConfig();
  return config[category] ?? null;
};

/**
 * Returns the entire rate configuration object.
 * Useful when the settlement calculator needs multiple categories at once.
 *
 * @returns {Promise<object>} The full rate configuration.
 */
export const getFullRateConfig = async () => {
  return loadRateConfig();
};

/**
 * Persists updated rate entries for a specific category.
 *
 * @param {string} category - Config category key.
 * @param {object} entries - The new category configuration object.
 * @returns {Promise<object>} The updated category config.
 */
export const saveRateConfig = async (category, entries) => {
  const config = loadRateConfig();
  config[category] = entries;
  localStorage.setItem(RATE_CONFIG_KEY, JSON.stringify(config));
  return config[category];
};

/**
 * Returns the domestic city-tier lookup table.
 *
 * @returns {Promise<Array<{ cityName: string, tier: string }>>}
 */
export const getDomesticCityTiers = async () => {
  return loadCityTiers();
};

/**
 * Persists updated domestic city-tier entries.
 *
 * @param {Array<{ cityName: string, tier: string }>} tiers - Full replacement array.
 * @returns {Promise<Array>} The saved tiers.
 */
export const saveDomesticCityTiers = async (tiers) => {
  localStorage.setItem(CITY_TIERS_KEY, JSON.stringify(tiers));
  return tiers;
};

/**
 * Returns the international country-tier lookup table.
 *
 * @returns {Promise<Array<{ countryOrCity: string, tier: string }>>}
 */
export const getIntlCountryTiers = async () => {
  return loadCountryTiers();
};

/**
 * Persists updated international country-tier entries.
 *
 * @param {Array<{ countryOrCity: string, tier: string }>} tiers - Full replacement array.
 * @returns {Promise<Array>} The saved tiers.
 */
export const saveIntlCountryTiers = async (tiers) => {
  localStorage.setItem(COUNTRY_TIERS_KEY, JSON.stringify(tiers));
  return tiers;
};

/**
 * Resets ALL rate configuration, city tiers, and country tiers
 * back to the original seed data. Useful for admin "restore defaults" action.
 *
 * @returns {Promise<void>}
 */
export const resetToDefaults = async () => {
  localStorage.setItem(RATE_CONFIG_KEY, JSON.stringify(seedRateConfig));
  localStorage.setItem(CITY_TIERS_KEY, JSON.stringify(seedCityTiers));
  localStorage.setItem(COUNTRY_TIERS_KEY, JSON.stringify(seedCountryTiers));
};
