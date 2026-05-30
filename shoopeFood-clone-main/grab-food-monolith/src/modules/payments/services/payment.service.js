const { Payment, PaymentTransaction, Order } = require('../../../models');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAYMENT_STUB_SECRET = process.env.PAYMENT_STUB_SECRET || 'stub-secret-dev';

const isValidStubSecret = (headerValue) => String(headerValue || '') === PAYMENT_STUB_SECRET;

const createPaymentWithIdempotency = async ({ orderId, idempotencyKey, paymentMethod }) => {
  const existingByKey = await Payment.findOne({ where: { idempotencyKey } });
  if (existingByKey) {
    return { httpStatus: 200, message: 'Idempotent replay', data: existingByKey };
  }

  const existingByOrder = await Payment.findOne({ where: { orderId } });
  if (existingByOrder) {
    throw new ConflictError(
      'A payment already exists for this order with a different idempotency key'
    );
  }

  const order = await Order.findByPk(Number(orderId));
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!order.totalAmount || Number(order.totalAmount) <= 0) {
    throw new BadRequestError('Order has invalid total amount for payment');
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

const processCallback = async ({ paymentId, gatewayRef }) => {
  const payment = await Payment.findByPk(Number(paymentId));
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  const FINAL_STATUSES = ['SUCCESS', 'FAILED'];

  if (FINAL_STATUSES.includes(payment.status)) {
    return {
      httpStatus: 200,
      message: 'Payment callback already processed',
      data: { payment, transaction: null },
    };
  }

  const attemptCount = await PaymentTransaction.count({ where: { paymentId } });

  await sleep(Math.floor(Math.random() * 1000) + 1000);

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

const simulateCallback = async ({ paymentId }) => {
  return processCallback({ paymentId, gatewayRef: `SIMULATE-${Date.now()}` });
};

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
