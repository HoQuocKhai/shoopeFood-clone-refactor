const {
  sequelize,
  User,
  Restaurant,
  Food,
  Category,
  OrderItem,
  DriverDetail,
  DriverLocation,
} = require('../../../models');
const orderRepository = require('../repositories/order.repository');
const orderFactory = require('../../../factories/orderFactory');
const shippingService = require('../../../services/shippingService');
const {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} = require('../../../common/errors');

const DEFAULT_SHIPPING_BASE_FEE = 20000;

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
      baseFee = DEFAULT_SHIPPING_BASE_FEE,
      discountAmount = 0,
      taxAmount = 0,
      statusCode = orderFactory.DEFAULT_ORDER_STATUS_CODE,
      shippingType = 'STANDARD',
      orderCode,
      idempotencyKey,
      items,
    } = payload;

    const [user, restaurant] = await Promise.all([
      User.findByPk(Number(customerId)),
      Restaurant.findByPk(Number(restaurantId)),
    ]);

    if (!user) throw new BadRequestError('customer not found');
    if (!restaurant) throw new BadRequestError('restaurant not found');
    if (!restaurant.isOpen) throw new BadRequestError('restaurant is closed');

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

      let normalizedSubtotal = Number(baseFee);
      const preparedOrderItems = [];

      if (items && items.length > 0) {
        normalizedSubtotal = 0;

        for (const requestedItem of items) {
          const food = await Food.findByPk(requestedItem.foodId, {
            include: [{ model: Category, as: 'category', attributes: ['id', 'restaurantId'] }],
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!food || !food.category || Number(food.category.restaurantId) !== restaurant.id) {
            throw new BadRequestError(
              `Food #${requestedItem.foodId} is not in this restaurant menu`
            );
          }

          if (!food.isAvailable) {
            throw new BadRequestError(`${food.name} is not available`);
          }

          const availableQuantity = Number(food.currentQuantity || 0);
          if (availableQuantity < requestedItem.quantity) {
            throw new ConflictError(
              `${food.name} only has ${availableQuantity} item(s) left today`
            );
          }

          const priceAtOrder = Number(food.price || 0);
          normalizedSubtotal += priceAtOrder * requestedItem.quantity;
          food.currentQuantity = availableQuantity - requestedItem.quantity;

          await food.save({ transaction });

          preparedOrderItems.push({
            foodId: food.id,
            quantity: requestedItem.quantity,
            priceAtOrder,
          });
        }
      }

      const shippingFee = shippingService.calculateShippingFee(
        Number(distanceKm),
        normalizedSubtotal,
        shippingType
      );
      const totalAmount = Math.max(
        0,
        normalizedSubtotal + shippingFee + Number(taxAmount) - Number(discountAmount)
      );

      const orderPayload = orderFactory.buildCreatePayload({
        orderCode,
        idempotencyKey,
        customerId: user.id,
        restaurantId: restaurant.id,
        driverId,
        voucherId,
        receiverAddress,
        receiverLat,
        receiverLng,
        distanceKm: Number(distanceKm),
        subtotalAmount: normalizedSubtotal,
        taxAmount: Number(taxAmount),
        totalAmount,
        shippingFee,
        discountAmount: Number(discountAmount),
        statusId: statusInfo.id,
      });

      const newOrder = await orderRepository.create(orderPayload, { transaction });

      if (preparedOrderItems.length > 0) {
        await OrderItem.bulkCreate(
          preparedOrderItems.map((item) => ({
            ...item,
            orderId: newOrder.id,
          })),
          { transaction }
        );
      }

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

  buildRoutePoints(from, to, steps = 40) {
    const points = [];
    const fromLat = Number(from.latitude || 0);
    const fromLng = Number(from.longitude || 0);
    const toLat = Number(to.latitude || 0);
    const toLng = Number(to.longitude || 0);

    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      const curve = Math.sin(ratio * Math.PI) * 0.0025;
      points.push({
        latitude: fromLat + (toLat - fromLat) * ratio + curve,
        longitude: fromLng + (toLng - fromLng) * ratio - curve * 0.65,
      });
    }
    return points;
  }

  calculateRouteProgress(location, routePoints = []) {
    if (!location || routePoints.length === 0) return 0;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    routePoints.forEach((point, index) => {
      const distance = Math.hypot(
        point.latitude - location.latitude,
        point.longitude - location.longitude
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return Math.round((nearestIndex / Math.max(routePoints.length - 1, 1)) * 100);
  }
}

module.exports = new OrderService();
