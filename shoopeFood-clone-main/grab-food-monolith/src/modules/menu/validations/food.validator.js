const Joi = require('joi');

const createFoodSchema = Joi.object({
  name: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.number().integer().positive().allow(null).optional(),
  isAvailable: Joi.boolean().default(true),
  defaultQuantity: Joi.number().integer().min(0).default(0),
  currentQuantity: Joi.number().integer().min(0).optional(),
});

const updateFoodSchema = Joi.object({
  name: Joi.string().trim().optional(),
  price: Joi.number().min(0).optional(),
  categoryId: Joi.number().integer().positive().allow(null).optional(),
  isAvailable: Joi.boolean().optional(),
  defaultQuantity: Joi.number().integer().min(0).optional(),
  currentQuantity: Joi.number().integer().min(0).optional(),
});

module.exports = {
  createFoodSchema,
  updateFoodSchema,
};
