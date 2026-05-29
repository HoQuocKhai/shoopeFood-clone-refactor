/**
 * Order Status Transition Rules
 * Source of truth for valid state transitions.
 * Only states actually seeded in order_statuses table.
 */
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKING_UP', 'CANCELLED'],
  PICKING_UP: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Returns list of valid next statuses from a given status code.
 * @param {string} fromCode
 * @returns {string[]}
 */
const getValidTransitions = (fromCode) =>
  VALID_TRANSITIONS[String(fromCode || '').toUpperCase()] || [];

/**
 * Checks if a transition from → to is valid.
 * @param {string} fromCode
 * @param {string} toCode
 * @returns {boolean}
 */
const validateTransition = (fromCode, toCode) => {
  const allowed = getValidTransitions(fromCode);
  return allowed.includes(String(toCode || '').toUpperCase());
};

/**
 * Returns all transitions map (for API response to UI).
 * @returns {Record<string, string[]>}
 */
const getAllTransitions = () => ({ ...VALID_TRANSITIONS });

module.exports = { VALID_TRANSITIONS, getValidTransitions, validateTransition, getAllTransitions };
