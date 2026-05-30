const Joi = require('joi');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const createRestaurantSchema = Joi.object({
  ownerId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().required(),
  address: Joi.string().trim().allow('').optional(),
  latitude: Joi.number().min(-90).max(90).default(0),
  longitude: Joi.number().min(-180).max(180).default(0),
  openingTime: Joi.string().pattern(timeRegex).default('07:00:00'),
  closingTime: Joi.string().pattern(timeRegex).default('22:00:00'),
  isOpen: Joi.boolean().default(true),
  imageUrl: Joi.string().trim().allow('').optional(),
  ratingAvg: Joi.number().default(5.0),
});

const updateRestaurantSchema = Joi.object({
  ownerId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().optional(),
  address: Joi.string().trim().allow('').optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  openingTime: Joi.string().pattern(timeRegex).optional(),
  closingTime: Joi.string().pattern(timeRegex).optional(),
  isOpen: Joi.boolean().optional(),
  isOpenToday: Joi.boolean().optional(),
  temporaryClosedReason: Joi.string().trim().allow('').optional(),
  temporaryClosedUntil: Joi.date().iso().allow(null).optional(),
  imageUrl: Joi.string().trim().allow('').optional(),
  ratingAvg: Joi.number().optional(),
});

const patchRestaurantStatusSchema = Joi.object({
  isOpen: Joi.boolean().required(),
});

const patchRestaurantTodayStatusSchema = Joi.object({
  isOpenToday: Joi.boolean().optional(),
  reason: Joi.string().trim().allow('').optional(),
  temporaryClosedUntil: Joi.date().iso().allow(null).optional(),
});

const patchRestaurantLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

const approveRestaurantSchema = Joi.object({
  approvedBy: Joi.number().integer().positive().optional(),
});

const rejectRestaurantSchema = Joi.object({
  reason: Joi.string().trim().required(),
});

const approveChangeRequestSchema = Joi.object({
  reviewedBy: Joi.number().integer().positive().optional(),
});

const rejectChangeRequestSchema = Joi.object({
  reason: Joi.string().trim().required(),
});

module.exports = {
  createRestaurantSchema,
  updateRestaurantSchema,
  patchRestaurantStatusSchema,
  patchRestaurantTodayStatusSchema,
  patchRestaurantLocationSchema,
  approveRestaurantSchema,
  rejectRestaurantSchema,
  approveChangeRequestSchema,
  rejectChangeRequestSchema,
};
