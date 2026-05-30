const express = require('express');
const orderStatusController = require('../controllers/order-status.controller');

const router = express.Router();

router.get('/', orderStatusController.getAll);
router.get('/transitions', orderStatusController.getTransitions);

module.exports = router;
