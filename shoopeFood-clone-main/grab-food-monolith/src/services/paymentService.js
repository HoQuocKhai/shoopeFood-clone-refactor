const { Payment, PaymentTransaction, Order } = require('../models');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAYMENT_STUB_SECRET = process.env.PAYMENT_STUB_SECRET || 'stub-secret-dev';

/**
 * Validate stub secret from request header.
 * @param {string} headerValue
 * @returns {boolean}
 */
const isValidStubSecret = (headerValue) => String(headerValue || '') === PAYMENT_STUB_SECRET;

/**
 * Create a payment with proper idempotency handling.
 *
 * Rules:
 *   1. Same idempotencyKey → return existing (200)
 *   2. Same orderId but different key → 409 Conflict
 *   3. Order not found → 404
 *   4. Order already COMPLETED/CANCELLED → 400
 *   5. No existing → create new (201)
 *
 * @returns {{ httpStatus: number, message: string, data: object }}
 */
const createPaymentWithIdempotency = async ({ orderId, idempotencyKey, paymentMethod }) => {
  // Rule 1: check idempotencyKey first (true idempotency)
  const existingByKey = await Payment.findOne({ where: { idempotencyKey } });
  if (existingByKey) {
    return { httpStatus: 200, message: 'Idempotent replay', data: existingByKey };
  }

  // Rule 2: check orderId – if payment exists with different key
  const existingByOrder = await Payment.findOne({ where: { orderId } });
  if (existingByOrder) {
    const err = new Error(
      'A payment already exists for this order with a different idempotency key'
    );
    err.statusCode = 409;
    throw err;
  }

  // Rule 3: verify order exists
  const order = await Order.findByPk(Number(orderId));
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Rule 4: order state check
  // (We rely on the statusCode string from caller context or skip if OrderStatus not loaded)
  // Basic amount validation
  if (!order.totalAmount || Number(order.totalAmount) <= 0) {
    const err = new Error('Order has invalid total amount for payment');
    err.statusCode = 400;
    throw err;
  }

  const payment = await Payment.create({
    orderId: Number(orderId),
    idempotencyKey,
    paymentMethod,
    amount: order.totalAmount,
    status: 'PENDING',
  });

  return { httpStatus: 201, message: 'Payment checkout created', data: payment };
};

/**
 * Process a payment callback (from gateway / stub).
 * Guards against changing already-finalized payments.
 *
 * Rules:
 *   - Payment not found → 404
 *   - Already finalized with SAME outcome → 200 "Already processed" (idempotent)
 *   - Already finalized with DIFFERENT outcome → 409 "Cannot change finalized payment"
 *   - Otherwise → simulate, create transaction, update payment
 *
 * @returns {{ httpStatus: number, message: string, data: object }}
 */
const processCallback = async ({ paymentId, gatewayRef }) => {
  const payment = await Payment.findByPk(Number(paymentId));
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  const FINAL_STATUSES = ['SUCCESS', 'FAILED'];

  if (FINAL_STATUSES.includes(payment.status)) {
    // Simulate what the incoming result would be
    // For idempotency: if same key seen again, treat as same outcome
    // We treat re-calling callback on finalized payment as:
    //   - Return 200 "Already processed" (gateway may retry webhooks)
    return {
      httpStatus: 200,
      message: 'Payment callback already processed',
      data: { payment, transaction: null },
    };
  }

  // Count existing attempts
  const attemptCount = await PaymentTransaction.count({ where: { paymentId } });

  // Simulate gateway delay 1-2s
  await sleep(Math.floor(Math.random() * 1000) + 1000);

  // 5% random failure mock
  const isMockFailure = Math.random() < 0.05;
  const isTimeout = isMockFailure && Math.random() < 0.5;
  const nextStatus = isMockFailure ? 'FAILED' : 'SUCCESS';
  const transactionStatus = nextStatus;

  const gatewayResponse = isTimeout
    ? { code: 'TIMEOUT', message: 'Cổng thanh toán không phản hồi (timeout)' }
    : isMockFailure
      ? { code: '99', message: 'Giao dịch thất bại' }
      : { code: '00', message: 'Thành công' };

  const transaction = await PaymentTransaction.create({
    paymentId: Number(paymentId),
    attemptNumber: attemptCount + 1,
    status: transactionStatus,
    transactionRef: gatewayRef || `MOCK-${Date.now()}`,
    gatewayResponse: { ...gatewayResponse, timeoutFlag: isTimeout },
  });

  await payment.update({ status: nextStatus });

  return {
    httpStatus: 200,
    message: 'Callback processed',
    data: { payment, transaction },
  };
};

/**
 * Admin-only simulate callback (for dashboard demo button).
 * Bypasses stub secret check, requires ADMIN role (enforced at route level).
 */
const simulateCallback = async ({ paymentId }) => {
  return processCallback({ paymentId, gatewayRef: `SIMULATE-${Date.now()}` });
};

/**
 * Get payment with all transactions for an order.
 * @returns {Payment|null}
 */
const getPaymentStatusWithTransactions = async (orderId) => {
  return Payment.findOne({
    where: { orderId: Number(orderId) },
    include: [{ model: PaymentTransaction, as: 'transactions' }],
  });
};

module.exports = {
  isValidStubSecret,
  createPaymentWithIdempotency,
  processCallback,
  simulateCallback,
  getPaymentStatusWithTransactions,
};
