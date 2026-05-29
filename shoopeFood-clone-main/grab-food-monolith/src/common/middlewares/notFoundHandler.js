const { NotFoundError } = require('../errors');

/**
 * Middleware to catch 404 and forward to error handler
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};

module.exports = notFoundHandler;
