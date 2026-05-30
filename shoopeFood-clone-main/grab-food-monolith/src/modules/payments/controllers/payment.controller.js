const paymentService = require('../services/payment.service');
const orderAccessService = require('../../../services/orderAccessService');
const { Order } = require('../../../models');
const { apiResponse, asyncHandler } = require('../../../common');
const { NotFoundError } = require('../../../common/errors');

exports.createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPaymentWithIdempotency(req.body);

  if (result.httpStatus === 200) {
    return apiResponse.ok(res, result.data, result.message);
  }
  return apiResponse.created(res, result.data, result.message);
});

exports.processPaymentCallback = asyncHandler(async (req, res) => {
  const result = await paymentService.processCallback(req.body);
  return apiResponse.ok(res, result.data, result.message);
});

exports.simulateCallback = asyncHandler(async (req, res) => {
  const result = await paymentService.simulateCallback(req.params);
  return apiResponse.ok(res, result.data, result.message);
});

exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (req.user) {
    const order = await Order.findByPk(Number(orderId));
    if (order) {
      await orderAccessService.assertCanAccessOrder(req.user, order);
    }
  }

  const payment = await paymentService.getPaymentStatusWithTransactions(orderId);

  if (!payment) {
    throw new NotFoundError('Payment not found for this order');
  }

  return apiResponse.ok(res, payment);
});
