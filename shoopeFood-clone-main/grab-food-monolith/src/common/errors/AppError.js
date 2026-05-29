/**
 * Base class for all application specific errors.
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Indicates if this is an expected error vs a bug

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
