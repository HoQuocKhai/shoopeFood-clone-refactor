const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const verifyPaymentStubSecret = require('../middleware/verifyPaymentStubSecret');

const router = express.Router();

// ─── Create payment (customer or admin) ──────────────────────────────────────
router.post('/create', auth, paymentController.createPayment);

// ─── Gateway callback (NOT Bearer token auth, uses stub-secret header) ───────
// In production this would verify gateway signature. For demo, uses x-stub-secret.
router.post('/callback', verifyPaymentStubSecret, paymentController.processPaymentCallback);

// ─── Admin simulate callback (for dashboard demo button) ─────────────────────
router.post(
  '/:paymentId/simulate-callback',
  auth,
  requireRole(['ADMIN']),
  paymentController.simulateCallback
);

// ─── Get payment status (Admin/Merchant, with scope check inside controller) ──
router.get(
  '/:orderId',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  paymentController.getPaymentStatus
);

module.exports = router;
