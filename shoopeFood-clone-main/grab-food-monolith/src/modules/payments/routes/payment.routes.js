const express = require('express');
const paymentController = require('../controllers/payment.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const verifyPaymentStubSecret = require('../../../middleware/verifyPaymentStubSecret');
const { validateRequest } = require('../../../common');
const { createPaymentSchema, callbackSchema } = require('../validations/payment.validator');

const router = express.Router();

router.post(
  '/create',
  auth,
  requireRole(['CUSTOMER']),
  validateRequest(createPaymentSchema),
  paymentController.createPayment
);

router.post(
  '/callback',
  verifyPaymentStubSecret,
  validateRequest(callbackSchema),
  paymentController.processPaymentCallback
);

router.post(
  '/:paymentId/simulate-callback',
  auth,
  requireRole(['ADMIN']),
  paymentController.simulateCallback
);

router.get(
  '/:orderId',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  paymentController.getPaymentStatus
);

module.exports = router;
