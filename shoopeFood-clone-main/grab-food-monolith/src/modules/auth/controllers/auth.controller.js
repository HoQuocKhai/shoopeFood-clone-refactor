const authService = require('../services/auth.service');
const { normalizeAuthUser } = require('../mappers/auth.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login({
    phone: req.body.phone?.trim(),
    password: req.body.password,
    role: req.body.role?.trim().toUpperCase(),
  });

  return apiResponse.ok(
    res,
    {
      token,
      user: normalizeAuthUser(user, req.body.role?.trim().toUpperCase()),
    },
    'Logged in'
  );
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return apiResponse.ok(res, normalizeAuthUser(user, req.user.role));
});
