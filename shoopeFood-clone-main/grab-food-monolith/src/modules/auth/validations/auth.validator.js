const Joi = require('joi');

const loginSchema = Joi.object({
  phone: Joi.string().trim().required(),
  password: Joi.string().required(),
  role: Joi.string().trim().valid('CUSTOMER', 'DRIVER', 'MERCHANT', 'ADMIN').required(),
});

module.exports = {
  loginSchema,
};
