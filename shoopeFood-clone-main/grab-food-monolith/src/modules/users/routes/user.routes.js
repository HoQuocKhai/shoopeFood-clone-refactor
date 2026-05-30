const express = require('express');
const userController = require('../controllers/user.controller');
const auth = require('../../../middleware/auth');
const requireRole = require('../../../middleware/role');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/user.validator');

const router = express.Router();

router.get('/profile', auth, userController.getProfile);

// Admin only routes for User CRUD
router.get('/', auth, requireRole(['ADMIN']), userController.getUsers);
router.get('/:id', auth, requireRole(['ADMIN']), userController.getUserById);

router.post(
  '/',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.createUserSchema),
  userController.createUser
);

router.put(
  '/:id',
  auth,
  requireRole(['ADMIN']),
  validateRequest(schemas.updateUserSchema),
  userController.updateUser
);

router.delete('/:id', auth, requireRole(['ADMIN']), userController.deleteUser);

module.exports = router;
