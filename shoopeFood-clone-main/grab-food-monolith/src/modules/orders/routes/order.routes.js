const express = require('express');
const orderController = require('../controllers/order.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const { createOrderSchema, updateOrderStatusSchema } = require('../validations/order.validator');

const router = express.Router();

// ─── Public ─────────────────────────────────────────────────────────────────
// Tracking is public (limited response – no phone/address/payment data)
router.get('/:id/tracking', orderController.getOrderTracking);

// ─── Customer ────────────────────────────────────────────────────────────────
// Create order (customer places order through client app)
router.post(
  '/',
  auth,
  requireRole(['CUSTOMER']),
  validateRequest(createOrderSchema),
  orderController.createOrder
);
// Backward-compat secure route (any authenticated user)
router.post('/secure', auth, validateRequest(createOrderSchema), orderController.createOrder);

// ─── Shared Authenticated ────────────────────────────────────────────────────────
// List orders (scope applied inside controller via orderAccessService)
router.get(
  '/',
  auth,
  requireRole(['ADMIN', 'MERCHANT', 'CUSTOMER', 'DRIVER']),
  orderController.getOrders
);

// Get order detail (scope checked inside controller)
router.get(
  '/:id',
  auth,
  requireRole(['ADMIN', 'MERCHANT', 'CUSTOMER', 'DRIVER']),
  orderController.getOrderById
);

// Update status (scope checked inside controller, transition validated in service)
router.put(
  '/:id/status',
  auth,
  requireRole(['ADMIN', 'MERCHANT', 'DRIVER']),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Status audit log
router.get(
  '/:id/status-logs',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  orderController.getOrderStatusLogs
);

// EJS page (kept for backward compat)
router.get('/page', orderController.getOrdersPage);

// ─── Admin only ──────────────────────────────────────────────────────────────
router.put('/:id', auth, requireRole(['ADMIN']), orderController.updateOrder);
router.delete('/:id', auth, requireRole(['ADMIN']), orderController.deleteOrder);

module.exports = router;
