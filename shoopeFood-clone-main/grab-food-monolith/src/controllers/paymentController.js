const paymentService = require('../services/paymentService');
const orderAccessService = require('../services/orderAccessService');
const orderRepository = require('../repositories/orderRepository');

/**
 * POST /api/payments/create
 * Creates a payment with proper idempotency:
 *   - Same idempotencyKey → 200 "Idempotent replay"
 *   - orderId has payment with different key → 409
 *   - Otherwise → 201 "Created"
 */
exports.createPayment = async (req, res) => {
  try {
    const { orderId, idempotencyKey, paymentMethod } = req.body;

    if (!orderId || !idempotencyKey || !paymentMethod) {
      return res
        .status(400)
        .json({ message: 'Missing required fields: orderId, idempotencyKey, paymentMethod' });
    }

    const result = await paymentService.createPaymentWithIdempotency({
      orderId,
      idempotencyKey,
      paymentMethod,
    });

    return res.status(result.httpStatus).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * POST /api/payments/callback
 * Gateway/stub callback endpoint. Protected by x-stub-secret header.
 * Does NOT use Bearer token auth (gateway does not log in as a user).
 *
 * Idempotency rules:
 *   - Payment already finalized with same outcome → 200 "Already processed"
 *   - Payment already finalized with different outcome → 409
 *   - Otherwise → process, create transaction, update payment
 */
exports.processPaymentCallback = async (req, res) => {
  try {
    const { paymentId, gatewayRef } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'paymentId is required' });
    }

    const result = await paymentService.processCallback({ paymentId, gatewayRef });
    return res.status(result.httpStatus).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * POST /api/payments/:paymentId/simulate-callback
 * Admin-only endpoint to simulate a payment callback for demo purposes.
 * Uses auth + requireRole(['ADMIN']) – separate from gateway callback.
 */
exports.simulateCallback = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await paymentService.simulateCallback({ paymentId });
    return res.status(result.httpStatus).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * GET /api/payments/:orderId
 * Returns payment + all transactions for an order.
 * Requires ADMIN or MERCHANT with scope check.
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Scope check: MERCHANT can only see payments for their restaurants
    if (req.user) {
      const order = await orderRepository.findEntityById(Number(orderId));
      if (order) {
        await orderAccessService.assertCanAccessOrder(req.user, order);
      }
    }

    const payment = await paymentService.getPaymentStatusWithTransactions(orderId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this order' });
    }

    return res.json({ data: payment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};
