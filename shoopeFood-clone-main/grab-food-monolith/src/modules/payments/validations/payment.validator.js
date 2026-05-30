const Joi = require('joi');

const createPaymentSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  idempotencyKey: Joi.string().required(),
  paymentMethod: Joi.string().valid('CASH', 'E_WALLET', 'CREDIT_CARD').required(),
});

const callbackSchema = Joi.object({
  paymentId: Joi.number().integer().positive().required(),
  gatewayRef: Joi.string().allow('').optional(),
});

module.exports = {
  createPaymentSchema,
  callbackSchema,
};
