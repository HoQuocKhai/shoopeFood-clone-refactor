const express = require('express');
const categoryController = require('../controllers/category.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/category.validator');

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.post(
  '/',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  auth,
  requireRole(['ADMIN', 'MERCHANT']),
  validateRequest(schemas.updateCategorySchema),
  categoryController.updateCategory
);

router.delete('/:id', auth, requireRole(['ADMIN', 'MERCHANT']), categoryController.deleteCategory);

module.exports = router;
