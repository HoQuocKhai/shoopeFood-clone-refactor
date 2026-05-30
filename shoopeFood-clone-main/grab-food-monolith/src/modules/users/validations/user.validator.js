const Joi = require('joi');

const createUserSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  password: Joi.string().trim().default('123456'),
  ratingAvg: Joi.number().default(5.0),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  password: Joi.string().trim().optional(),
  ratingAvg: Joi.number().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
