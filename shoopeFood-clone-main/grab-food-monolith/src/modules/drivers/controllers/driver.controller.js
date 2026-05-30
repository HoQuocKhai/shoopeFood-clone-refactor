const driverService = require('../services/driver.service');
const { normalizeDriver, normalizeDriverLocation } = require('../mappers/driver.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.getAllDrivers = asyncHandler(async (req, res) => {
  const items = await driverService.getAllDrivers();
  return apiResponse.ok(res, items.map(normalizeDriver), 'Drivers fetched');
});

exports.getDriverById = asyncHandler(async (req, res) => {
  const item = await driverService.getDriverById(Number(req.params.id));
  return apiResponse.ok(res, normalizeDriver(item), 'Driver fetched');
});

exports.createDriver = asyncHandler(async (req, res) => {
  const item = await driverService.createDriver(req.body);
  return apiResponse.created(res, normalizeDriver(item), 'Created');
});

exports.updateDriver = asyncHandler(async (req, res) => {
  const item = await driverService.updateDriver(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeDriver(item), 'Updated');
});

exports.deleteDriver = asyncHandler(async (req, res) => {
  const item = await driverService.deleteDriver(Number(req.params.id));
  return apiResponse.ok(res, normalizeDriver(item), 'Deleted');
});

exports.updateDriverLocation = asyncHandler(async (req, res) => {
  const item = await driverService.updateDriverLocation(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeDriverLocation(item), 'Location tracked');
});

exports.updateOnlineStatus = asyncHandler(async (req, res) => {
  const item = await driverService.updateOnlineStatus(Number(req.params.id), req.body.isOnline);
  return apiResponse.ok(res, normalizeDriver(item), 'Status updated');
});
