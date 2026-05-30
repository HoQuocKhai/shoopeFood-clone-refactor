const express = require('express');
const foodController = require('../controllers/food.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/food.validator');

const router = express.Router();

router.get('/', foodController.getAllFoods);
router.get('/:id', foodController.getFoodById);

router.post(
  '/',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.createFoodSchema),
  foodController.createFood
);

router.put(
  '/:id',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.updateFoodSchema),
  foodController.updateFood
);

router.delete('/:id', auth, requireRole(['ADMIN', 'MERCHANT']), foodController.deleteFood);

module.exports = router;
