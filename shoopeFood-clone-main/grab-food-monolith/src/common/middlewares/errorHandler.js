const { AppError } = require('../errors');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let responseError = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong on the server',
    details: null,
  };

  // If the error is an instance of our AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    responseError.code = err.code;
    responseError.message = err.message;
    responseError.details = err.details;
  }
  // Handle Sequelize validation errors (optional, since it's common)
  else if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    statusCode = 400;
    responseError.code = 'VALIDATION_ERROR';
    responseError.message = err.errors.map((e) => e.message).join(', ');
    responseError.details = err.errors;
  }
  // Otherwise, it's an unhandled exception
  else {
    // In development, you might want to log or send the full stack trace
    console.error('Unhandled Exception:', err);

    if (process.env.NODE_ENV === 'development') {
      responseError.details = err.stack;
      responseError.message = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: responseError,
  });
};

module.exports = errorHandler;
