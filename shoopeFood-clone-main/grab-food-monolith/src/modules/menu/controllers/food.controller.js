const foodService = require('../services/food.service');
const { normalizeFood } = require('../mappers/food.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.getAllFoods = asyncHandler(async (req, res) => {
  const params = { ...req.query };
  if (params.restaurantId !== undefined) params.restaurantId = Number(params.restaurantId);
  if (params.categoryId !== undefined) params.categoryId = Number(params.categoryId);

  const items = await foodService.getAllFoods(params);
  return apiResponse.ok(res, items.map(normalizeFood), 'Foods fetched');
});

exports.getFoodById = asyncHandler(async (req, res) => {
  const item = await foodService.getFoodById(Number(req.params.id));
  return apiResponse.ok(res, normalizeFood(item), 'Food fetched');
});

exports.createFood = asyncHandler(async (req, res) => {
  const item = await foodService.createFood(req.body);
  return apiResponse.created(res, normalizeFood(item), 'Created');
});

exports.updateFood = asyncHandler(async (req, res) => {
  const item = await foodService.updateFood(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeFood(item), 'Updated');
});

exports.deleteFood = asyncHandler(async (req, res) => {
  const item = await foodService.deleteFood(Number(req.params.id));
  return apiResponse.ok(res, normalizeFood(item), 'Deleted');
});
