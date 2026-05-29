const { OrderStatus } = require('../models');
const { getAllTransitionRules } = require('../services/orderStatusService');

/**
 * GET /api/order-statuses
 * Returns all order statuses ordered by sort_order.
 */
exports.getAll = async (req, res) => {
  try {
    const statuses = await OrderStatus.findAll({
      order: [['sort_order', 'ASC']],
    });
    return res.json({ data: statuses });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/order-statuses/transitions
 * Returns the full transition rules map.
 * UI uses this to build valid-transition dropdowns, not hard-code logic.
 */
exports.getTransitions = (req, res) => {
  try {
    return res.json({ data: getAllTransitionRules() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
