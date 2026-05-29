const { Restaurant } = require('../models');

/**
 * Get all restaurantIds belonging to a merchant user.
 * @param {number} userId
 * @returns {Promise<number[]>}
 */
const getMerchantRestaurantIds = async (userId) => {
  const restaurants = await Restaurant.findAll({
    where: { ownerId: Number(userId) },
    attributes: ['id'],
  });
  return restaurants.map((r) => r.id);
};

/**
 * Check if a user can access a given order.
 * - ADMIN: always allowed
 * - MERCHANT: only orders belonging to their restaurants
 * - DRIVER: only their own assigned orders
 * - Others: denied
 *
 * @param {object} user - req.user
 * @param {object} order - normalized or raw order (needs restaurantId, driverId)
 * @returns {Promise<boolean>}
 */
const canAccessOrder = async (user, order) => {
  const role = String(user.role || '').toUpperCase();

  if (role === 'ADMIN') return true;

  if (role === 'MERCHANT') {
    const restaurantIds = await getMerchantRestaurantIds(user.id);
    return restaurantIds.includes(Number(order.restaurantId));
  }

  if (role === 'DRIVER') {
    return Number(order.driverId) === Number(user.id);
  }

  return false;
};

/**
 * Assert access and throw 403 if not allowed.
 * @param {object} user - req.user
 * @param {object} order
 * @throws {Error} with status 403
 */
const assertCanAccessOrder = async (user, order) => {
  const allowed = await canAccessOrder(user, order);
  if (!allowed) {
    const err = new Error('Forbidden: you do not have access to this order');
    err.statusCode = 403;
    throw err;
  }
};

module.exports = { getMerchantRestaurantIds, canAccessOrder, assertCanAccessOrder };
