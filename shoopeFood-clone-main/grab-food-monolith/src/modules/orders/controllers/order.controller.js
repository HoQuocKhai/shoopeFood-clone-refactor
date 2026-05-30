const { User, Restaurant, OrderStatus, OrderStatusLog } = require('../../../models');
const orderRepository = require('../repositories/order.repository');
const orderService = require('../services/order.service');
const orderMapper = require('../mappers/order.mapper');
const { socketManager } = require('../../tracking');
const orderAccessService = require('../../../services/orderAccessService');
const orderStatusService = require('../../../services/orderStatusService');
const shippingService = require('../../../services/shippingService');
const { apiResponse, asyncHandler } = require('../../../common');
const { NotFoundError, BadRequestError, ConflictError } = require('../../../common/errors');
const orderFactory = require('../../../factories/orderFactory');

exports.createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body);

  const orderData = orderMapper.normalizeOrder(result.order);

  if (result.duplicated) {
    return apiResponse.ok(res, orderData, 'Duplicated idempotency key');
  }

  try {
    socketManager.getIO().emit('new_order', orderData);
  } catch (e) {
    console.log('Socket not ready or err', e.message);
  }

  return apiResponse.created(res, orderData, 'Created');
});

exports.getOrders = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.statusId) filters.statusId = Number(req.query.statusId);
  else if (req.query.statusCode) {
    const resolvedStatus = await orderService.resolveStatusByCode(req.query.statusCode);
    if (resolvedStatus) filters.statusId = resolvedStatus.id;
  }
  if (req.query.restaurantId) filters.restaurantId = Number(req.query.restaurantId);
  if (req.query.customerId) filters.customerId = Number(req.query.customerId);
  if (req.query.driverId) filters.driverId = Number(req.query.driverId);
  if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate);
  if (req.query.toDate) filters.toDate = new Date(req.query.toDate);

  // Merchant scope
  if (req.user && String(req.user.role).toUpperCase() === 'MERCHANT') {
    const restaurantIds = await orderAccessService.getMerchantRestaurantIds(req.user.id);
    if (restaurantIds.length === 0) {
      return apiResponse.ok(res, []);
    }
    filters.restaurantIds = restaurantIds;
  }

  const items = await orderRepository.findAll(filters);
  return apiResponse.ok(res, items.map(orderMapper.normalizeOrder));
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const item = await orderRepository.findById(id);

  if (!item) {
    throw new NotFoundError('Order not found');
  }

  if (req.user) {
    await orderAccessService.assertCanAccessOrder(req.user, item);
  }

  return apiResponse.ok(res, orderMapper.normalizeOrder(item));
});

exports.getOrderTracking = asyncHandler(async (req, res) => {
  const { item, restaurant, driver, latestLocation } = await orderService.getOrderTracking(
    req.params.id
  );
  const orderData = orderMapper.normalizeOrder(item);
  const restaurantData = orderMapper.normalizeRestaurantForTracking(restaurant);

  const destination = {
    latitude: Number(orderData.receiverLat || restaurantData?.latitude || 0),
    longitude: Number(orderData.receiverLng || restaurantData?.longitude || 0),
  };

  const routePoints = restaurantData
    ? orderService.buildRoutePoints(restaurantData, destination)
    : [];

  let locationData = orderMapper.normalizeDriverLocation(latestLocation);
  if (!locationData && restaurantData && orderData.driverId) {
    locationData = {
      id: null,
      driverId: orderData.driverId,
      orderId: orderData.id,
      latitude: restaurantData.latitude,
      longitude: restaurantData.longitude,
      heading: 0,
      speedKmh: 0,
      createdAt: null,
    };
  }

  const routeProgress = orderService.calculateRouteProgress(locationData, routePoints);

  return apiResponse.ok(
    res,
    {
      order: orderData,
      restaurant: restaurantData,
      driver: orderMapper.normalizeDriverForTracking(driver),
      driverLocation: locationData,
      destination,
      routePoints,
      routeProgress,
    },
    'Tracking retrieved'
  );
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const item = await orderRepository.findEntityById(id);

  if (!item) {
    throw new NotFoundError('Order not found');
  }

  const {
    customerId,
    restaurantId,
    receiverAddress,
    receiverLat,
    receiverLng,
    distanceKm,
    baseFee,
    status,
    statusCode,
    discountAmount,
    taxAmount,
    shippingType = 'STANDARD',
    driverId,
    voucherId,
    expectedVersion,
  } = req.body;

  if (expectedVersion !== undefined && Number(expectedVersion) !== Number(item.version)) {
    throw new ConflictError('Version conflict');
  }

  if (customerId !== undefined) {
    const user = await User.findByPk(Number(customerId));
    if (!user) throw new BadRequestError('customer not found');
    item.customerId = Number(customerId);
  }

  if (restaurantId !== undefined) {
    const restaurant = await Restaurant.findByPk(Number(restaurantId));
    if (!restaurant) throw new BadRequestError('restaurant not found');
    item.restaurantId = Number(restaurantId);
  }

  if (receiverAddress !== undefined) item.receiverAddress = String(receiverAddress).trim();
  if (receiverLat !== undefined) item.receiverLat = Number(receiverLat);
  if (receiverLng !== undefined) item.receiverLng = Number(receiverLng);
  if (distanceKm !== undefined) item.distanceKm = Number(distanceKm);
  if (driverId !== undefined)
    item.driverId = Number.isFinite(Number(driverId)) ? Number(driverId) : null;
  if (voucherId !== undefined)
    item.voucherId = Number.isFinite(Number(voucherId)) ? Number(voucherId) : null;

  const incomingStatusCode = statusCode !== undefined ? statusCode : status;
  if (incomingStatusCode !== undefined) {
    const resolvedStatus = await orderService.resolveStatusByCode(incomingStatusCode);
    if (!resolvedStatus) throw new BadRequestError('Invalid statusCode');
    item.statusId = resolvedStatus.id;
  }

  const nextBaseFee =
    baseFee !== undefined ? Number(baseFee) : orderMapper.getBaseFeeFromOrder(item) || 20000;
  const normalizedDistance = Number(item.distanceKm || 0);
  const nextDiscount =
    discountAmount !== undefined ? Number(discountAmount) : Number(item.discountAmount || 0);
  const nextTax = taxAmount !== undefined ? Number(taxAmount) : Number(item.taxAmount || 0);

  item.shippingFee = shippingService.calculateShippingFee(
    normalizedDistance,
    nextBaseFee,
    shippingType
  );
  item.subtotalAmount = nextBaseFee;
  item.discountAmount = nextDiscount;
  item.taxAmount = nextTax;
  item.totalAmount = nextBaseFee + Number(item.shippingFee || 0) + nextTax - nextDiscount;
  item.version = Number(item.version || 0) + 1;

  const latest = await orderRepository.save(item);
  const orderData = orderMapper.normalizeOrder(latest || item);

  try {
    socketManager.getIO().emit('order:updated', orderData);
    socketManager.getIO().emit(`order:${orderData.id}:updated`, orderData);
  } catch (error) {
    console.log('Socket not ready or err', error.message);
  }

  return apiResponse.ok(res, orderData, 'Updated');
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status, statusCode, expectedVersion, reason } = req.body;

  const item = await orderRepository.findEntityById(id);
  if (!item) {
    throw new NotFoundError('Order not found');
  }

  if (req.user) {
    await orderAccessService.assertCanAccessOrder(req.user, item);
  }

  const targetCode = statusCode !== undefined ? statusCode : status;
  const resolvedStatus = await orderStatusService.resolveStatus(targetCode);
  if (!resolvedStatus) {
    throw new BadRequestError('Invalid statusCode');
  }

  const currentStatus = await OrderStatus.findByPk(item.statusId);
  const currentCode = currentStatus ? currentStatus.code : null;

  await orderStatusService.changeStatus({
    orderId: id,
    oldStatusCode: currentCode,
    newStatusCode: resolvedStatus.code,
    newStatusId: resolvedStatus.id,
    expectedVersion: expectedVersion !== undefined ? Number(expectedVersion) : null,
    changedBy: req.user ? req.user.id : null,
    reason: reason || null,
  });

  const latest = await orderRepository.findById(id);
  const orderData = orderMapper.normalizeOrder(latest);

  try {
    socketManager.getIO().emit('order:updated', orderData);
    socketManager.getIO().emit(`order:${orderData.id}:updated`, orderData);
  } catch (socketErr) {
    console.log('Socket not ready or err', socketErr.message);
  }

  return apiResponse.ok(res, orderData, 'Updated');
});

exports.getOrderStatusLogs = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const item = await orderRepository.findEntityById(id);

  if (!item) {
    throw new NotFoundError('Order not found');
  }

  if (req.user) {
    await orderAccessService.assertCanAccessOrder(req.user, item);
  }

  const logs = await OrderStatusLog.findAll({
    where: { orderId: id },
    include: [{ model: User, as: 'changedByUser', attributes: ['id', 'fullName'] }],
    order: [['created_at', 'DESC']],
  });

  return apiResponse.ok(res, logs);
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const item = await orderRepository.findEntityById(id);

  if (!item) {
    throw new NotFoundError('Order not found');
  }

  const deleted = await orderRepository.delete(item);
  return apiResponse.ok(res, deleted, 'Deleted');
});

exports.getOrdersPage = asyncHandler(async (req, res) => {
  try {
    const items = await orderRepository.findAll();
    res.render('orders', {
      orders: items.map(orderMapper.normalizeOrder),
    });
  } catch (error) {
    res.render('orders', { orders: [] });
  }
});
