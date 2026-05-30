const categoryService = require('../services/category.service');
const { normalizeCategory } = require('../mappers/category.mapper');
const { apiResponse, asyncHandler } = require('../../../common');

exports.getAllCategories = asyncHandler(async (req, res) => {
  const items = await categoryService.getAllCategories(
    req.query.restaurantId ? Number(req.query.restaurantId) : undefined
  );
  return apiResponse.ok(res, items.map(normalizeCategory), 'Categories fetched');
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const item = await categoryService.getCategoryById(Number(req.params.id));
  return apiResponse.ok(res, normalizeCategory(item), 'Category fetched');
});

exports.createCategory = asyncHandler(async (req, res) => {
  const item = await categoryService.createCategory(req.body);
  return apiResponse.created(res, normalizeCategory(item), 'Created');
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const item = await categoryService.updateCategory(Number(req.params.id), req.body);
  return apiResponse.ok(res, normalizeCategory(item), 'Updated');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const item = await categoryService.deleteCategory(Number(req.params.id));
  return apiResponse.ok(res, normalizeCategory(item), 'Deleted');
});
