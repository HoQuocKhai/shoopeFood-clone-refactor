const { BadRequestError } = require('../errors');

/**
 * Middleware to validate requests using Joi or similar schema.
 * @param {Object} schema - Validation schema (Joi object typically)
 * @param {String} source - 'body', 'query', or 'params'
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();

    // Support for Joi schemas
    if (typeof schema.validate === 'function') {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new BadRequestError(errorMessage, 'VALIDATION_ERROR', error.details));
      }

      // Update the request with validated/sanitized values
      req[source] = value;
    }
    // Add logic for other validation libraries if necessary

    next();
  };
};

module.exports = validateRequest;
