const { isValidStubSecret } = require('../modules/payments/services/payment.service');

/**
 * Middleware to verify payment stub secret from x-stub-secret header.
 * Used on /api/payments/callback (gateway-facing endpoint).
 * For admin simulate, use auth + requireRole(['ADMIN']) instead.
 */
module.exports = (req, res, next) => {
  const secret = req.headers['x-stub-secret'] || '';
  if (!isValidStubSecret(secret)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or missing x-stub-secret header',
    });
  }
  return next();
};
