const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/restaurant.validator');

const router = express.Router();

// ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

router.get('/pending', auth, requireRole(['ADMIN']), restaurantController.listPendingRestaurants);

router.post(
  '/:id/approve',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.approveRestaurantSchema),
  restaurantController.approveRestaurant
);

router.post(
  '/:id/reject',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.rejectRestaurantSchema),
  restaurantController.rejectRestaurant
);

router.get(
  '/change-requests',
  auth,
  requireRole(['ADMIN']),
  restaurantController.listChangeRequests
);

router.post(
  '/change-requests/:id/approve',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.approveChangeRequestSchema),
  restaurantController.approveChangeRequest
);

router.post(
  '/change-requests/:id/reject',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.rejectChangeRequestSchema),
  restaurantController.rejectChangeRequest
);

// ─── MERCHANT ENDPOINTS ──────────────────────────────────────────────────────
router.get('/my', auth, requireRole(['MERCHANT']), restaurantController.listMyRestaurants);

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────
router.get('/', restaurantController.listRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

// ─── CRUD (Merchant + Admin) ─────────────────────────────────────────────────
router.post(
  '/',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.createRestaurantSchema),
  restaurantController.createRestaurant
);

router.put(
  '/:id',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.updateRestaurantSchema),
  restaurantController.updateRestaurant
);

router.delete(
  '/:id',
  auth,
  requireRole(['ADMIN']), // Only admin can soft-delete
  restaurantController.deleteRestaurant
);

// ─── STATUS & LOCATION PATCH ─────────────────────────────────────────────────
router.patch(
  '/:id/status',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.patchRestaurantStatusSchema),
  restaurantController.patchRestaurantStatus
);

router.patch(
  '/:id/today-status',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.patchRestaurantTodayStatusSchema),
  restaurantController.patchRestaurantTodayStatus
);

router.patch(
  '/:id/location',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.patchRestaurantLocationSchema),
  restaurantController.patchRestaurantLocation
);

module.exports = router;
