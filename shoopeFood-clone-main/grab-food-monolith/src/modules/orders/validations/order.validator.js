const Joi = require('joi');

const createOrderSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  restaurantId: Joi.number().integer().positive().required(),
  driverId: Joi.number().integer().positive().allow(null).optional(),
  voucherId: Joi.number().integer().positive().allow(null).optional(),
  receiverAddress: Joi.string().allow('').optional(),
  receiverLat: Joi.number().required(),
  receiverLng: Joi.number().required(),
  distanceKm: Joi.number().min(0).default(2),
  baseFee: Joi.number().min(0).default(20000),
  discountAmount: Joi.number().min(0).default(0),
  taxAmount: Joi.number().min(0).default(0),
  statusCode: Joi.string().default('PENDING'),
  shippingType: Joi.string().valid('STANDARD', 'FAST', 'ECO').default('STANDARD'),
  orderCode: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        foodId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
      })
    )
    .min(1)
    .required(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().optional(),
  statusCode: Joi.string().optional(),
  expectedVersion: Joi.number().integer().min(0).optional(),
  reason: Joi.string().allow('').optional(),
}).or('status', 'statusCode');

const normalizeRequestedOrderItems = (items) => {
  if (items === undefined) {
    return { hasItems: false, items: [] };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'items must be a non-empty array' };
  }

  const itemMap = new Map();
  for (const item of items) {
    const foodId = Number(item.foodId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      return { error: 'items.foodId must be a positive integer' };
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: 'items.quantity must be a positive integer' };
    }

    itemMap.set(foodId, (itemMap.get(foodId) || 0) + quantity);
  }

  return {
    hasItems: true,
    items: Array.from(itemMap.entries()).map(([foodId, quantity]) => ({ foodId, quantity })),
  };
};

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  normalizeRequestedOrderItems,
};
