const userService = require('../services/user.service');
const { normalizeUser } = require('../mappers/user.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.getProfile = (req, res) => {
  res.json({ message: 'User profile endpoint', user: req.user || null });
};

exports.getUsers = asyncHandler(async (req, res) => {
  const items = await userService.getUsers();
  return apiResponse.ok(res, items.map(normalizeUser), 'Users fetched');
});

exports.getUserById = asyncHandler(async (req, res) => {
  const item = await userService.getUserById(Number(req.params.id));
  return apiResponse.ok(res, normalizeUser(item), 'User fetched');
});

exports.createUser = asyncHandler(async (req, res) => {
  const item = await userService.createUser(req.body);
  return apiResponse.created(res, normalizeUser(item), 'Created');
});

exports.updateUser = asyncHandler(async (req, res) => {
  const item = await userService.updateUser(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeUser(item), 'Updated');
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const item = await userService.deleteUser(Number(req.params.id));
  return apiResponse.ok(res, normalizeUser(item), 'Deleted');
});
