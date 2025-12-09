/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for maintainability
 */

/** Pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 5,
} as const;

/** Fee and discount rates */
export const FEES = {
  /** Service charge rate (8.25%) */
  SERVICE_CHARGE_RATE: 0.0825,
  /** Loyalty discount rate (10%) */
  LOYALTY_DISCOUNT_RATE: 0.10,
  /** Minimum points required for loyalty discount */
  LOYALTY_DISCOUNT_THRESHOLD: 100,
} as const;

/** Password security settings */
export const PASSWORD = {
  MIN_LENGTH: 6,
  SALT_ROUNDS: 10,
} as const;

/**
 * Valid U.S. state abbreviations for address validation.
 * Includes all 50 states plus DC.
 */
export const US_STATES: Set<string> = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
]);
