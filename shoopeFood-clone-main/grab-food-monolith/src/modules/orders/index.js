const orderRoutes = require('./routes/order.routes');
const orderStatusRoutes = require('./routes/order-status.routes');
const orderController = require('./controllers/order.controller');
const orderService = require('./services/order.service');
const orderRepository = require('./repositories/order.repository');

module.exports = {
  orderRoutes,
  orderStatusRoutes,
  orderController,
  orderService,
  orderRepository,
};
