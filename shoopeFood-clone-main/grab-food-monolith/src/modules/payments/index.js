const paymentRoutes = require('./routes/payment.routes');
const paymentController = require('./controllers/payment.controller');
const paymentService = require('./services/payment.service');

module.exports = {
  paymentRoutes,
  paymentController,
  paymentService,
};
