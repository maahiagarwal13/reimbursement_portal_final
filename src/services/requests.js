/**
 * Reimbursement Requests Service
 * ─────────────────────────────────────────────────────────────────────────────
 * The core service for the portal. Handles CRUD for all request types plus
 * the complete settlement calculation logic. Components MUST NOT perform
 * settlement math themselves — it all lives here.
 *
 * Settlement rules:
 *   Domestic: per diem = rate × days; hotel = min(actual, cap) — CL4/A+ is
 *             uncapped; flight = actuals (no cap).
 *   Intl:     per diem & hotel from intlPerDiem/intlHotel (USD);
 *             Japan uses japanPerDiem/japanHotel (JPY).
 *   Carpool:  own vehicle cost = distance / mileage × fuelRate, capped daily.
 *   Internet: min(claimed, CL-based cap).
 *   Relocation: per-component caps applied.
 *
 * All localStorage access is encapsulated — no component reads 'sem_*' keys.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import seedRequests from '../data/sampleRequests.json';
import seedEmployees from '../data/employees.json';
import seedRateConfig from '../data/rateConfig.json';
import seedCityTiers from '../data/domesticCityTiers.json';
import seedCountryTiers from '../data/intlCountryTiers.json';
import { generateId } from '../utils/idGenerator';
import { getTenureBand, getDaysBetween } from '../utils/dateHelpers';

const REQUESTS_KEY = 'sem_requests';
const EMPLOYEES_KEY = 'sem_employees';
const RATE_CONFIG_KEY = 'sem_rateConfig';
const CITY_TIERS_KEY = 'sem_cityTiers';
const COUNTRY_TIERS_KEY = 'sem_countryTiers';

// ── Store helpers ─────────────────────────────────────────────────────────

const loadRequests = () => {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(seedRequests));
  return [...seedRequests];
};

const persistRequests = (requests) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
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

const loadCityTiers = () => {
  const stored = localStorage.getItem(CITY_TIERS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(CITY_TIERS_KEY, JSON.stringify(seedCityTiers));
  return [...seedCityTiers];
};

const loadCountryTiers = () => {
  const stored = localStorage.getItem(COUNTRY_TIERS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(COUNTRY_TIERS_KEY, JSON.stringify(seedCountryTiers));
  return [...seedCountryTiers];
};

// ── Rate lookup helpers (settlement logic — MUST stay in service layer) ──

/**
 * Resolves the domestic city tier for a destination.
 * Falls back to 'C' if the city is not found in the tier list.
 * @param {string} destination - City name.
 * @returns {string} Tier: 'A+', 'A', 'B', or 'C'.
 */
const resolveDomesticCityTier = (destination) => {
  const tiers = loadCityTiers();
  const match = tiers.find(
    (t) => t.cityName.toLowerCase() === destination.toLowerCase()
  );
  return match ? match.tier : 'C'; // Area C is the fallback
};

/**
 * Resolves the international country/city tier for a destination.
 * Falls back to 'C' if not found.
 * @param {string} destination - Country or city name.
 * @returns {string} Tier: 'A', 'B', 'C', or 'Japan'.
 */
const resolveIntlCountryTier = (destination) => {
  const tiers = loadCountryTiers();
  const normalised = destination.toLowerCase();
  const match = tiers.find(
    (t) => t.countryOrCity.toLowerCase() === normalised
  );
  return match ? match.tier : 'C'; // default to C for unlisted destinations
};

/**
 * Gets the tier index for domestic hotel rates.
 * Tier order: ['A+', 'A', 'B', 'C'] → indices 0–3.
 * @param {string} tier - City tier.
 * @returns {number} Index into the hotel rate array.
 */
const domesticTierIndex = (tier) => {
  const order = ['A+', 'A', 'B', 'C'];
  const idx = order.indexOf(tier);
  return idx >= 0 ? idx : 3; // fallback to C (index 3)
};

/**
 * Gets the tier index for international rates.
 * Tier order: ['A', 'B', 'C'] → indices 0–2.
 * @param {string} tier - Country tier.
 * @returns {number} Index into the rate array.
 */
const intlTierIndex = (tier) => {
  const order = ['A', 'B', 'C'];
  const idx = order.indexOf(tier);
  return idx >= 0 ? idx : 2; // fallback to C (index 2)
};

/**
 * Retrieves the per diem rate for a domestic trip.
 * CL3 employees have tenure-split rates.
 * @param {string} cl - Career level (CL2, CL3, CL4).
 * @param {string} joiningDate - ISO date for tenure calculation.
 * @returns {number} Daily per diem amount in INR.
 */
const getDomesticPerDiemRate = (cl, joiningDate) => {
  const config = loadRateConfig();
  const rates = config.domesticPerDiem.rates;

  if (cl === 'CL3') {
    const band = getTenureBand(joiningDate);
    return rates.CL3[band].value;
  }
  return rates[cl]?.value ?? 0;
};

/**
 * Retrieves the hotel cap for a domestic trip.
 * @param {string} cl - Career level.
 * @param {string} joiningDate - ISO date.
 * @param {string} tier - City tier.
 * @returns {number|null} Nightly cap in INR, or null if uncapped (actuals).
 */
const getDomesticHotelCap = (cl, joiningDate, tier) => {
  const config = loadRateConfig();
  const rates = config.domesticHotel.rates;
  const idx = domesticTierIndex(tier);

  if (cl === 'CL3') {
    const band = getTenureBand(joiningDate);
    return rates.CL3[band][idx];
  }
  return rates[cl]?.[idx] ?? null;
};

/**
 * Retrieves the per diem rate for an international trip.
 * @param {string} cl - Career level.
 * @param {string} tier - Country tier (A, B, C).
 * @returns {{ rate: number, currency: string }}
 */
const getIntlPerDiemRate = (cl, tier) => {
  const config = loadRateConfig();

  if (tier === 'Japan') {
    const rate = config.japanPerDiem.rates[cl]?.value ?? 0;
    return { rate, currency: 'JPY' };
  }

  const idx = intlTierIndex(tier);
  const rate = config.intlPerDiem.rates[cl]?.[idx] ?? 0;
  return { rate, currency: 'USD' };
};

/**
 * Retrieves the hotel cap for an international trip.
 * @param {string} cl - Career level.
 * @param {string} tier - Country tier (A, B, C, Japan).
 * @returns {{ cap: number, currency: string }}
 */
const getIntlHotelCap = (cl, tier) => {
  const config = loadRateConfig();

  if (tier === 'Japan') {
    const cap = config.japanHotel.rates[cl]?.value ?? 0;
    return { cap, currency: 'JPY' };
  }

  const idx = intlTierIndex(tier);
  const cap = config.intlHotel.rates[cl]?.[idx] ?? 0;
  return { cap, currency: 'USD' };
};

// ── Settlement calculators ────────────────────────────────────────────────

/**
 * Computes the settlement breakdown for a domestic travel request.
 * @param {object} params
 * @param {string} params.cl - Employee CL.
 * @param {string} params.joiningDate - ISO date.
 * @param {string} params.destination - Domestic city.
 * @param {string} params.startDate - Trip start (ISO).
 * @param {string} params.endDate - Trip end (ISO).
 * @param {number} params.hotelActual - Actual hotel spend.
 * @param {number} params.flightActual - Actual flight spend.
 * @returns {object} Computed settlement object.
 */
const computeDomesticSettlement = ({
  cl,
  joiningDate,
  destination,
  startDate,
  endDate,
  hotelActual,
  flightActual,
}) => {
  const tier = resolveDomesticCityTier(destination);
  const days = getDaysBetween(startDate, endDate);

  const perDiemRate = getDomesticPerDiemRate(cl, joiningDate);
  const perDiemTotal = perDiemRate * days;

  const hotelCap = getDomesticHotelCap(cl, joiningDate, tier);
  // null cap means uncapped (actuals reimbursed) — CL4 in A+ tier
  const hotelReimbursable =
    hotelCap === null ? hotelActual : Math.min(hotelActual, hotelCap * days);

  // Flights: always actuals, no cap
  const flightReimbursable = flightActual;

  const totalReimbursable = perDiemTotal + hotelReimbursable + flightReimbursable;

  return {
    hotelActual,
    flightActual,
    perDiemDays: days,
    perDiemRate,
    perDiemTotal,
    hotelCap,
    hotelReimbursable,
    flightReimbursable,
    totalReimbursable,
    cityTier: tier,
    currency: 'INR',
  };
};

/**
 * Computes the settlement breakdown for an international travel request.
 * @param {object} params - Same shape as domestic, plus intl-specific fields.
 * @returns {object} Computed settlement object.
 */
const computeIntlSettlement = ({
  cl,
  destination,
  startDate,
  endDate,
  hotelActual,
  flightActual,
}) => {
  const tier = resolveIntlCountryTier(destination);
  const days = getDaysBetween(startDate, endDate);

  const { rate: perDiemRate, currency } = getIntlPerDiemRate(cl, tier);
  const perDiemTotal = perDiemRate * days;

  const { cap: hotelCapPerNight } = getIntlHotelCap(cl, tier);
  const hotelReimbursable = Math.min(hotelActual, hotelCapPerNight * days);

  // Flights: actuals, no cap
  const flightReimbursable = flightActual;

  const totalReimbursable = perDiemTotal + hotelReimbursable + flightReimbursable;

  return {
    hotelActual,
    flightActual,
    perDiemDays: days,
    perDiemRate,
    perDiemTotal,
    hotelCapPerNight,
    hotelReimbursable,
    flightReimbursable,
    totalReimbursable,
    countryTier: tier,
    currency,
  };
};

/**
 * Computes the carpool reimbursement for own-vehicle claims.
 * Formula: (distance / mileage) × fuelRate, capped at daily cap × workingDays.
 * @param {object} params
 * @returns {object} Carpool settlement object.
 */
const computeCarpoolOwn = ({
  distanceOneWayKm,
  claimType,
  workingDays,
}) => {
  const config = loadRateConfig();
  const fuelRate = config.carpoolOwnFuelRate.value;
  const mileage = config.carpoolOwnMileage.value;
  const dailyCap =
    claimType === 'both_way'
      ? config.carpoolCapBothWay.value
      : config.carpoolCapOneWay.value;

  const multiplier = claimType === 'both_way' ? 2 : 1;
  const totalDistanceKm = distanceOneWayKm * multiplier * workingDays;
  const computedCost = Math.round((totalDistanceKm / mileage) * fuelRate);
  const cappedTotal = dailyCap * workingDays;
  const reimbursable = Math.min(computedCost, cappedTotal);

  return {
    vehicleType: 'own',
    claimType,
    distanceOneWayKm,
    totalDistanceKm,
    fuelRate,
    mileage,
    computedCost,
    dailyCap,
    cappedTotal,
    reimbursable,
    currency: 'INR',
  };
};

/**
 * Computes the carpool reimbursement for rented-vehicle claims.
 * Simply caps the claimed amount at dailyCap × workingDays.
 * @param {object} params
 * @returns {object} Carpool settlement object.
 */
const computeCarpoolRented = ({
  distanceOneWayKm,
  claimType,
  workingDays,
  claimedAmount,
}) => {
  const config = loadRateConfig();
  const dailyCap =
    claimType === 'both_way'
      ? config.carpoolCapBothWay.value
      : config.carpoolCapOneWay.value;

  const multiplier = claimType === 'both_way' ? 2 : 1;
  const totalDistanceKm = distanceOneWayKm * multiplier * workingDays;
  const cappedTotal = dailyCap * workingDays;
  const reimbursable = Math.min(claimedAmount, cappedTotal);

  return {
    vehicleType: 'rented',
    claimType,
    distanceOneWayKm,
    totalDistanceKm,
    claimedAmount,
    dailyCap,
    cappedTotal,
    reimbursable,
    currency: 'INR',
  };
};

/**
 * Computes relocation reimbursement with per-component caps.
 * @param {string} cl - Employee career level.
 * @param {Array<{ component: string, actualAmount: number }>} lineItems
 * @returns {object} Relocation settlement object with capped line items.
 */
const computeRelocationSettlement = (cl, lineItems) => {
  const config = loadRateConfig();

  const componentCapMap = {
    accommodation: config.relocationAccommodation.rates[cl]?.value ?? 0,
    brokerage: config.relocationBrokerage.rates[cl]?.value ?? 0,
    shipment: config.relocationShipment.rates[cl]?.value ?? 0,
  };

  const computedItems = lineItems.map((item) => {
    const cap = componentCapMap[item.component] ?? 0;
    return {
      component: item.component,
      actualAmount: item.actualAmount,
      cap,
      reimbursable: Math.min(item.actualAmount, cap),
    };
  });

  const totalReimbursable = computedItems.reduce(
    (sum, item) => sum + item.reimbursable,
    0
  );

  return {
    lineItems: computedItems,
    totalReimbursable,
    currency: 'INR',
  };
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns all reimbursement requests.
 * @returns {Promise<Array<object>>}
 */
export const getAllRequests = async () => {
  return loadRequests();
};

/**
 * Returns requests for a specific employee.
 * @param {string} ghrId - Employee GHR ID.
 * @returns {Promise<Array<object>>}
 */
export const getRequestsByEmployee = async (ghrId) => {
  const requests = loadRequests();
  const normalizedId = String(ghrId).trim();
  return requests.filter((r) => r.ghrId === normalizedId);
};

/**
 * Returns a single request by its ID.
 * @param {string} id - Request ID.
 * @returns {Promise<object|null>}
 */
export const getRequestById = async (id) => {
  const requests = loadRequests();
  return requests.find((r) => r.id === id) ?? null;
};

/**
 * Creates a new travel pre-approval request.
 *
 * @param {object} dto
 * @param {string} dto.ghrId - Employee GHR ID.
 * @param {string} dto.subtype - 'domestic' or 'international'.
 * @param {string} dto.startDate - Trip start (ISO).
 * @param {string} dto.endDate - Trip end (ISO).
 * @param {string} dto.destination - Travel destination.
 * @param {string} dto.purpose - Business justification.
 * @param {object} [dto.documents] - Supporting documents.
 * @returns {Promise<object>} The created request.
 */
export const createTravelPreApproval = async (dto) => {
  const requests = loadRequests();

  const newRequest = {
    id: generateId(),
    ghrId: String(dto.ghrId).trim(),
    type: 'travel',
    subtype: dto.subtype,
    stage: 'pre-approval',
    preApprovalStatus: 'pending',
    settlementStatus: null,
    dates: {
      startDate: dto.startDate,
      endDate: dto.endDate,
    },
    purpose: dto.purpose,
    destination: dto.destination,
    documents: {
      preApproval: {
        managerApprovalRef: dto.managerApprovalRef || null,
        travelItinerary: dto.travelItinerary || null,
      },
      settlement: null,
    },
    settlement: null,
    submittedAt: new Date().toISOString(),
    financeNote: null,
  };

  requests.push(newRequest);
  persistRequests(requests);
  return newRequest;
};

/**
 * Submits a settlement for an existing pre-approved travel request.
 *
 * CRITICAL: Dates (startDate/endDate) are pulled from the linked pre-approval
 * record — they are NOT supplied by the caller. This prevents date tampering
 * and ensures consistency.
 *
 * @param {string} id - The request ID (must be an approved pre-approval).
 * @param {object} dto
 * @param {number} dto.hotelActual - Actual hotel spend.
 * @param {number} dto.flightActual - Actual flight spend.
 * @param {object} [dto.documents] - Settlement supporting documents.
 * @returns {Promise<object>} The updated request with computed settlement.
 * @throws {Error} If the request is not found or not in a valid state.
 */
export const submitSettlement = async (id, dto) => {
  const requests = loadRequests();
  const index = requests.findIndex((r) => r.id === id);

  if (index < 0) {
    throw new Error(`Request ${id} not found.`);
  }

  const request = requests[index];

  if (request.type !== 'travel') {
    throw new Error('Settlement can only be submitted for travel requests.');
  }

  if (request.preApprovalStatus !== 'approved') {
    throw new Error(
      'Settlement can only be submitted for requests with approved pre-approval.'
    );
  }

  // Pull dates from the pre-approval — never from the settlement DTO
  const { startDate, endDate } = request.dates;

  // Look up the employee for CL and joining date
  const employees = loadEmployees();
  const employee = employees.find((e) => e.ghrId === request.ghrId);

  if (!employee) {
    throw new Error(`Employee ${request.ghrId} not found.`);
  }

  const cl = employee.cl;
  const joiningDate = employee.joiningDate;

  let settlement;

  if (request.subtype === 'domestic') {
    settlement = computeDomesticSettlement({
      cl,
      joiningDate,
      destination: request.destination,
      startDate,
      endDate,
      hotelActual: dto.hotelActual,
      flightActual: dto.flightActual,
    });
  } else if (request.subtype === 'international') {
    settlement = computeIntlSettlement({
      cl,
      destination: request.destination,
      startDate,
      endDate,
      hotelActual: dto.hotelActual,
      flightActual: dto.flightActual,
    });
  } else {
    throw new Error(`Unknown travel subtype: ${request.subtype}`);
  }

  // Update the request
  requests[index] = {
    ...request,
    stage: 'settlement',
    settlementStatus: 'pending',
    settlement,
    documents: {
      ...request.documents,
      settlement: dto.documents || {
        hotelReceipts: [],
        flightTickets: [],
        foodReceipts: [],
      },
    },
  };

  persistRequests(requests);
  return requests[index];
};

/**
 * Creates a new internet reimbursement request.
 *
 * @param {object} dto
 * @param {string} dto.ghrId - Employee GHR ID.
 * @param {string} dto.billingMonth - Month being claimed (e.g. '2025-06').
 * @param {number} dto.claimedAmount - Amount claimed.
 * @param {string} [dto.internetBill] - Uploaded bill filename.
 * @param {boolean} [dto.isSelfDeclared=false] - Whether this is a self-declaration.
 * @param {string} [dto.declarationText] - Self-declaration text.
 * @param {string} [dto.purpose] - Purpose description.
 * @param {number} [dto.noOfMonths] - Number of months being claimed.
 * @returns {Promise<object>} The created request.
 */
export const createInternetRequest = async (dto) => {
  const employees = loadEmployees();
  const employee = employees.find((e) => e.ghrId === String(dto.ghrId).trim());

  if (!employee) {
    throw new Error(`Employee ${dto.ghrId} not found.`);
  }

  const config = loadRateConfig();
  const cl = employee.cl;
  const noOfMonths = dto.noOfMonths || 1;
  const cap = (config.internetCap.rates[cl]?.value ?? 0) * noOfMonths;

  const requests = loadRequests();

  const newRequest = {
    id: generateId(),
    ghrId: String(dto.ghrId).trim(),
    type: 'internet',
    subtype: null,
    stage: 'review',
    preApprovalStatus: null,
    settlementStatus: 'pending',
    dates: {
      billingMonth: dto.month || dto.billingMonth,
      noOfMonths,
      submittedDate: new Date().toISOString().split('T')[0],
    },
    purpose: dto.purpose || `Monthly internet reimbursement for ${dto.month || dto.billingMonth}`,
    destination: null,
    documents: {
      internetBill: dto.internetBill || null,
      isSelfDeclared: dto.isSelfDeclared || false,
      declarationText: dto.declarationText || null,
    },
    settlement: {
      claimedAmount: dto.claimedAmount,
      cap,
      approvedAmount: null, // finance will set this on review
      currency: 'INR',
    },
    submittedAt: new Date().toISOString(),
    financeNote: null,
  };

  requests.push(newRequest);
  persistRequests(requests);
  return newRequest;
};

/**
 * Creates a new carpool reimbursement request.
 *
 * @param {object} dto
 * @param {string} dto.ghrId - Employee GHR ID.
 * @param {string} dto.claimMonth - Month being claimed (e.g. '2025-06').
 * @param {number} dto.workingDays - Number of working days in the month.
 * @param {string} dto.vehicleType - 'own' or 'rented'.
 * @param {string} dto.claimType - 'one_way' or 'both_way'.
 * @param {number} dto.distanceOneWayKm - One-way commute distance in km.
 * @param {number} [dto.claimedAmount] - Required for rented vehicles.
 * @param {string} [dto.purpose] - Purpose description.
 * @param {object} [dto.documents] - Supporting documents.
 * @returns {Promise<object>} The created request.
 */
export const createCarpoolRequest = async (dto) => {
  const requests = loadRequests();

  let settlement;
  if (dto.vehicleType === 'own') {
    settlement = computeCarpoolOwn({
      distanceOneWayKm: dto.distanceOneWayKm,
      claimType: dto.claimType,
      workingDays: dto.workingDays,
    });
  } else if (dto.vehicleType === 'rented') {
    settlement = computeCarpoolRented({
      distanceOneWayKm: dto.distanceOneWayKm,
      claimType: dto.claimType,
      workingDays: dto.workingDays,
      claimedAmount: dto.claimedAmount,
    });
  } else {
    throw new Error(`Unknown vehicle type: ${dto.vehicleType}`);
  }

  const newRequest = {
    id: generateId(),
    ghrId: String(dto.ghrId).trim(),
    type: 'carpool',
    subtype: null,
    stage: 'review',
    preApprovalStatus: null,
    settlementStatus: 'pending',
    dates: {
      claimMonth: dto.claimMonth,
      workingDays: dto.workingDays,
    },
    purpose: dto.purpose || `Carpool claim for ${dto.claimMonth}`,
    destination: null,
    documents: dto.documents || {},
    settlement,
    submittedAt: new Date().toISOString(),
    financeNote: null,
  };

  requests.push(newRequest);
  persistRequests(requests);
  return newRequest;
};

/**
 * Creates a new relocation reimbursement request.
 *
 * @param {object} dto
 * @param {string} dto.ghrId - Employee GHR ID.
 * @param {string} dto.relocationDate - Date of relocation (ISO).
 * @param {string} dto.destination - New location.
 * @param {string} [dto.purpose] - Relocation reason.
 * @param {Array<{ component: string, actualAmount: number }>} dto.lineItems
 *   Components: 'accommodation', 'brokerage', 'shipment'.
 * @param {object} [dto.documents] - Supporting documents.
 * @returns {Promise<object>} The created request.
 */
export const createRelocationRequest = async (dto) => {
  const employees = loadEmployees();
  const employee = employees.find((e) => e.ghrId === String(dto.ghrId).trim());

  if (!employee) {
    throw new Error(`Employee ${dto.ghrId} not found.`);
  }

  const cl = employee.cl;
  const settlement = computeRelocationSettlement(cl, dto.lineItems);

  const requests = loadRequests();

  const newRequest = {
    id: generateId(),
    ghrId: String(dto.ghrId).trim(),
    type: 'relocation',
    subtype: null,
    stage: 'review',
    preApprovalStatus: null,
    settlementStatus: 'pending',
    dates: {
      relocationDate: dto.relocationDate,
      submittedDate: new Date().toISOString().split('T')[0],
    },
    purpose: dto.purpose || 'Employee relocation',
    destination: dto.destination,
    documents: dto.documents || {},
    settlement,
    submittedAt: new Date().toISOString(),
    financeNote: null,
  };

  requests.push(newRequest);
  persistRequests(requests);
  return newRequest;
};

/**
 * Finance review action — approves or rejects a request.
 *
 * @param {string} id - Request ID.
 * @param {object} params
 * @param {string} params.action - 'approve' or 'reject'.
 * @param {string} [params.financeNote] - Optional note from finance reviewer.
 * @returns {Promise<object>} The updated request.
 * @throws {Error} If request not found or action is invalid.
 */
export const financeReview = async (id, { action, financeNote }) => {
  if (!['approve', 'reject'].includes(action)) {
    throw new Error(`Invalid review action: ${action}. Must be 'approve' or 'reject'.`);
  }

  const requests = loadRequests();
  const index = requests.findIndex((r) => r.id === id);

  if (index < 0) {
    throw new Error(`Request ${id} not found.`);
  }

  const request = requests[index];
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Determine which status field to update based on stage
  if (request.stage === 'pre-approval') {
    requests[index] = {
      ...request,
      preApprovalStatus: newStatus,
      financeNote: financeNote || request.financeNote,
    };
  } else {
    // settlement stage, or internet/carpool/relocation review
    requests[index] = {
      ...request,
      settlementStatus: newStatus,
      financeNote: financeNote || request.financeNote,
    };

    // For internet requests, set the approved amount on approval
    if (
      request.type === 'internet' &&
      action === 'approve' &&
      request.settlement
    ) {
      requests[index].settlement = {
        ...request.settlement,
        approvedAmount: Math.min(
          request.settlement.claimedAmount,
          request.settlement.cap
        ),
      };
    }
  }

  persistRequests(requests);
  return requests[index];
};
