const express = require('express');
const authController = require('../controllers/auth.controller');
const auth = require('../../../middleware/auth');
const { validateRequest } = require('../../../common');
const schemas = require('../validations/auth.validator');

const router = express.Router();

router.post('/login', validateRequest(schemas.loginSchema), authController.login);
router.get('/me', auth, authController.me);

module.exports = router;
