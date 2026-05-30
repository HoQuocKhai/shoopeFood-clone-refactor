const { OrderStatus } = require('../../../models');
const { getAllTransitionRules } = require('../../../services/orderStatusService');
const { apiResponse, asyncHandler } = require('../../../common');

exports.getAll = asyncHandler(async (req, res) => {
  const statuses = await OrderStatus.findAll({
    order: [['sort_order', 'ASC']],
  });
  return apiResponse.ok(res, statuses, 'Order statuses fetched');
});

exports.getTransitions = asyncHandler(async (req, res) => {
  return apiResponse.ok(res, getAllTransitionRules(), 'Transitions fetched');
});
