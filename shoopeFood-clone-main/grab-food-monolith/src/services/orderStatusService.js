const { sequelize, Order, OrderStatus, OrderStatusLog } = require('../models');
const {
  validateTransition,
  getValidTransitions,
  getAllTransitions,
} = require('../utils/orderStatusTransition');

/**
 * Returns valid next status codes from a given status code.
 * Delegates to utility.
 */
const getValidTransitionsForStatus = (fromCode) => getValidTransitions(fromCode);

/**
 * Returns all transition rules (for API /transitions endpoint).
 */
const getAllTransitionRules = () => getAllTransitions();

/**
 * Atomically changes order status and inserts a status log entry.
 * Uses optimistic locking (WHERE version = expectedVersion).
 *
 * @param {object} params
 * @param {number} params.orderId
 * @param {string} params.oldStatusCode  - current status code (for log + validation)
 * @param {string} params.newStatusCode  - target status code
 * @param {number} params.newStatusId    - resolved DB id for newStatusCode
 * @param {number|null} params.expectedVersion
 * @param {number|null} params.changedBy - req.user.id
 * @param {string|null} params.reason
 * @returns {Promise<void>}
 * @throws {Error} with statusCode 400 (invalid transition) | 409 (version conflict)
 */
const changeStatus = async ({
  orderId,
  oldStatusCode,
  newStatusCode,
  newStatusId,
  expectedVersion,
  changedBy = null,
  reason = null,
}) => {
  // Validate transition before touching DB
  if (!validateTransition(oldStatusCode, newStatusCode)) {
    const err = new Error(`Invalid status transition: ${oldStatusCode} → ${newStatusCode}`);
    err.statusCode = 400;
    throw err;
  }

  await sequelize.transaction(async (t) => {
    // Atomic UPDATE with version check
    const whereClause = { id: orderId };
    if (expectedVersion !== undefined && expectedVersion !== null) {
      whereClause.version = Number(expectedVersion);
    }

    const [affectedRows] = await Order.update(
      {
        statusId: newStatusId,
        version: sequelize.literal('version + 1'),
      },
      {
        where: whereClause,
        transaction: t,
      }
    );

    if (affectedRows === 0) {
      const err = new Error('Version conflict: order was modified by another request');
      err.statusCode = 409;
      throw err;
    }

    // Insert status log
    await OrderStatusLog.create(
      {
        orderId,
        previousStatus: oldStatusCode || null,
        newStatus: newStatusCode,
        changedBy: changedBy || null,
        reason: reason || null,
        createdAt: new Date(),
      },
      { transaction: t }
    );
  });
};

/**
 * Resolve an OrderStatus record by code or id.
 * @param {string|number} statusCode
 * @returns {Promise<OrderStatus|null>}
 */
const resolveStatus = async (statusCode) => {
  const normalized = String(statusCode || '')
    .trim()
    .toUpperCase();
  if (!normalized) return null;
  return OrderStatus.findOne({ where: { code: normalized } });
};

module.exports = {
  getValidTransitionsForStatus,
  getAllTransitionRules,
  changeStatus,
  resolveStatus,
};
