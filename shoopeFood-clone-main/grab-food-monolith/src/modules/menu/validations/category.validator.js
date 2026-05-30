const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  restaurantId: Joi.number().integer().positive().required(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  restaurantId: Joi.number().integer().positive().optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
