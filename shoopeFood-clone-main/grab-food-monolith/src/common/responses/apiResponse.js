/**
 * Helper to construct standard API success responses
 */

const ok = (res, data = null, message = 'Operation successful', meta = undefined) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

const created = (res, data = null, message = 'Created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

module.exports = {
  ok,
  created,
};
