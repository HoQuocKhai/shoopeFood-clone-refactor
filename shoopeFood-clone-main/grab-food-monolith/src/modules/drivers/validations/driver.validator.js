const Joi = require('joi');

const createDriverSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  password: Joi.string().trim().default('123456'),
  ratingAvg: Joi.number().default(5.0),
  vehicleType: Joi.string().trim().allow('').optional(),
  licensePlate: Joi.string().trim().allow('').optional(),
  isOnline: Joi.boolean().default(false),
});

const updateDriverSchema = Joi.object({
  fullName: Joi.string().trim().optional(),
  phone: Joi.string().trim().optional(),
  password: Joi.string().trim().optional(),
  ratingAvg: Joi.number().optional(),
  vehicleType: Joi.string().trim().allow('').optional(),
  licensePlate: Joi.string().trim().allow('').optional(),
  isOnline: Joi.boolean().optional(),
});

const updateDriverLocationSchema = Joi.object({
  orderId: Joi.number().integer().positive().allow(null, '').optional(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  heading: Joi.number().default(0),
  speedKmh: Joi.number().default(24),
});

const updateOnlineStatusSchema = Joi.object({
  isOnline: Joi.boolean().required(),
});

module.exports = {
  createDriverSchema,
  updateDriverSchema,
  updateDriverLocationSchema,
  updateOnlineStatusSchema,
};
