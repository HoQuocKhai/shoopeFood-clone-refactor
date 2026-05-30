const express = require('express');
const driverController = require('../controllers/driver.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/driver.validator');

const router = express.Router();

router.get('/', auth, requireRole(['ADMIN']), driverController.getAllDrivers);
router.get('/:id', auth, requireRole(['ADMIN']), driverController.getDriverById);

router.post(
  '/',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.createDriverSchema),
  driverController.createDriver
);

router.put(
  '/:id',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.updateDriverSchema),
  driverController.updateDriver
);

router.delete('/:id', auth, requireRole(['ADMIN']), driverController.deleteDriver);

// Driver tracking routes
router.post(
  '/:id/location',
  auth,
  requireRole(['DRIVER', 'ADMIN']),
  validateRequest(schemas.updateDriverLocationSchema),
  driverController.updateDriverLocation
);

router.patch(
  '/:id/status',
  auth,
  requireRole(['DRIVER', 'ADMIN']),
  validateRequest(schemas.updateOnlineStatusSchema),
  driverController.updateOnlineStatus
);

module.exports = router;
