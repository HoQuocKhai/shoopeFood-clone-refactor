const authRoutes = require('./routes/auth.routes');
const authController = require('./controllers/auth.controller');
const authService = require('./services/auth.service');

module.exports = {
  authRoutes,
  authController,
  authService,
};
