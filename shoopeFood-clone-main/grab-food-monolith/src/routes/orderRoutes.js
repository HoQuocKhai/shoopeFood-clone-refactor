const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// ─── Public ─────────────────────────────────────────────────────────────────
// Tracking is public (limited response – no phone/address/payment data)
router.get('/:id/tracking', orderController.getOrderTracking);

// ─── Customer ────────────────────────────────────────────────────────────────
// Create order (customer places order through client app)
router.post('/', auth, requireRole(['CUSTOMER']), orderController.createOrder);
// Backward-compat secure route (any authenticated user)
router.post('/secure', auth, orderController.createOrder);

// ─── Admin + Merchant ────────────────────────────────────────────────────────
// List orders (merchant scope applied inside controller via orderAccessService)
router.get('/', auth, requireRole(['ADMIN', 'MERCHANT']), orderController.getOrders);

// Get order detail (scope checked inside controller)
router.get('/:id', auth, requireRole(['ADMIN', 'MERCHANT']), orderController.getOrderById);

// Update status (scope checked inside controller, transition validated in service)
router.put(
  '/:id/status',
  auth,
  requireRole(['ADMIN', 'MERCHANT', 'DRIVER']),
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
