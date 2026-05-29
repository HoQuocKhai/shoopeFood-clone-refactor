/**
 * Wraps async controller functions to pass unhandled rejections to next()
 * This removes the need for try/catch blocks in every controller method.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
