const {
  sequelize,
  Restaurant,
  Food,
  Category,
  OrderItem,
  DriverDetail,
  DriverLocation,
  User,
} = require('../../../models');
const orderRepository = require('../repositories/order.repository');
const orderFactory = require('../../../factories/orderFactory');
const shippingService = require('../../../services/shippingService');
const orderPricingService = require('./order-pricing.service');
const orderValidationService = require('./order-validation.service');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../common/errors');

class OrderService {
  async resolveStatusByCode(statusCode) {
    const { OrderStatus } = require('../../../models');
    const normalizedCode = orderFactory.resolveStatusCode(statusCode);
    const status = await OrderStatus.findOne({ where: { code: normalizedCode } });
    return status;
  }

  async createOrder(payload) {
    const {
      customerId,
      restaurantId,
      driverId,
      voucherId,
      receiverAddress = '',
      receiverLat,
      receiverLng,
      distanceKm = 2,
      discountAmount = 0,
      taxAmount = 0,
      statusCode = orderFactory.DEFAULT_ORDER_STATUS_CODE,
      shippingType = 'STANDARD',
      orderCode,
      idempotencyKey,
      items,
    } = payload;

    // ── Validate items exist ──────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Order must contain at least one food item');
    }

    // ── Validate customer (must have CUSTOMER role) & restaurant ──────────────
    const [customer, restaurant] = await Promise.all([
      orderValidationService.assertCustomerExists(customerId),
      orderValidationService.assertRestaurantOpen(restaurantId),
    ]);

    const [statusInfo, duplicated] = await Promise.all([
      this.resolveStatusByCode(statusCode),
      idempotencyKey ? orderRepository.findByIdempotencyKey(idempotencyKey) : Promise.resolve(null),
    ]);

    if (!statusInfo) {
      throw new BadRequestError('Invalid statusCode');
    }

    if (duplicated) {
      return { duplicated: true, order: duplicated };
    }

    let createdOrderId = null;

    await sequelize.transaction(async (transaction) => {
      await Food.resetExpiredDailyQuantities({ transaction });

      const preparedOrderItems = [];

      for (const requestedItem of items) {
        const food = await Food.findByPk(requestedItem.foodId, {
          include: [{ model: Category, as: 'category', attributes: ['id', 'restaurantId'] }],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!food || !food.category || Number(food.category.restaurantId) !== restaurant.id) {
          throw new BadRequestError(`Food #${requestedItem.foodId} is not in this restaurant menu`);
        }

        if (!food.isAvailable) {
          throw new BadRequestError(`${food.name} is not available`);
        }

        const availableQuantity = Number(food.currentQuantity || 0);
        if (availableQuantity < requestedItem.quantity) {
          throw new ConflictError(`${food.name} only has ${availableQuantity} item(s) left today`);
        }

        const priceAtOrder = Number(food.price || 0);
        food.currentQuantity = availableQuantity - requestedItem.quantity;

        await food.save({ transaction });

        preparedOrderItems.push({
          foodId: food.id,
          quantity: requestedItem.quantity,
          priceAtOrder,
        });
      }

      // ── Calculate pricing ────────────────────────────────────────────────
      const shippingFee = shippingService.calculateShippingFee(
        Number(distanceKm),
        0, // baseFee no longer used for subtotal; shipping calculated from distance
        shippingType
      );

      const pricing = orderPricingService.calculate({
        items: preparedOrderItems.map((item) => ({
          unitPrice: item.priceAtOrder,
          quantity: item.quantity,
        })),
        shippingFee,
        taxAmount: Number(taxAmount),
        discountAmount: Number(discountAmount),
      });

      const orderPayload = orderFactory.buildCreatePayload({
        orderCode,
        idempotencyKey,
        customerId: customer.id,
        restaurantId: restaurant.id,
        driverId,
        voucherId,
        receiverAddress,
        receiverLat,
        receiverLng,
        distanceKm: Number(distanceKm),
        subtotalAmount: pricing.subtotalAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        shippingFee: pricing.shippingFee,
        discountAmount: pricing.discountAmount,
        statusId: statusInfo.id,
      });

      const newOrder = await orderRepository.create(orderPayload, { transaction });

      await OrderItem.bulkCreate(
        preparedOrderItems.map((item) => ({
          ...item,
          orderId: newOrder.id,
        })),
        { transaction }
      );

      createdOrderId = newOrder.id;
    });

    const created = await orderRepository.findById(createdOrderId);
    return { duplicated: false, order: created };
  }

  async getOrderTracking(id) {
    const item = await orderRepository.findById(Number(id));
    if (!item) {
      throw new NotFoundError('Order not found');
    }

    const [restaurant, driver, latestLocation] = await Promise.all([
      Restaurant.findByPk(item.restaurantId),
      item.driverId
        ? DriverDetail.findOne({
            where: { userId: item.driverId },
            include: [
              {
                model: User,
                as: 'driverUser',
                attributes: ['id', 'fullName', 'phone', 'ratingAvg'],
              },
            ],
          })
        : Promise.resolve(null),
      item.driverId
        ? DriverLocation.findOne({
            where: { driverId: item.driverId, orderId: item.id },
            order: [['created_at', 'DESC']],
          })
        : Promise.resolve(null),
    ]);

    return { item, restaurant, driver, latestLocation };
  }
}

module.exports = new OrderService();
