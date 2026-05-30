const { Restaurant, RestaurantChangeRequest, User } = require('../../../models');
const { BadRequestError, NotFoundError } = require('../../../common/errors');

const verifyTimes = (openingTime, closingTime) => {
  const open = openingTime.split(':').slice(0, 2).join(':');
  const close = closingTime.split(':').slice(0, 2).join(':');
  if (open >= close) {
    throw new BadRequestError('closingTime must be after openingTime');
  }
};

const pickDefined = (obj, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (obj.hasOwnProperty(field) && obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  return result;
};

class RestaurantService {
  async listRestaurants({ includePending }) {
    const where = { deletedAt: null };
    if (includePending !== 'true') {
      where.approvalStatus = 'APPROVED';
    }
    return Restaurant.findAll({ where, order: [['id', 'ASC']] });
  }

  async getRestaurantById(id) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    return item;
  }

  async listMyRestaurants(ownerId) {
    return Restaurant.findAll({
      where: { ownerId, deletedAt: null },
      order: [['id', 'ASC']],
    });
  }

  async createRestaurant(payload) {
    const owner = await User.findByPk(payload.ownerId);
    if (!owner) throw new BadRequestError('Owner not found');

    verifyTimes(payload.openingTime, payload.closingTime);

    return Restaurant.create({
      ...payload,
      approvalStatus: 'PENDING',
    });
  }

  async updateRestaurant(id, payload, requestedBy) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');

    const directFields = [
      'openingTime',
      'closingTime',
      'isOpen',
      'isOpenToday',
      'temporaryClosedReason',
      'temporaryClosedUntil',
    ];
    const approvalFields = [
      'ownerId',
      'name',
      'address',
      'latitude',
      'longitude',
      'imageUrl',
      'ratingAvg',
    ];

    const directUpdates = pickDefined(payload, directFields);
    const approvalUpdates = pickDefined(payload, approvalFields);

    if (Object.keys(directUpdates).length > 0) {
      if (directUpdates.openingTime || directUpdates.closingTime) {
        const opening = directUpdates.openingTime || item.openingTime;
        const closing = directUpdates.closingTime || item.closingTime;
        verifyTimes(opening, closing);
      }
      await item.update(directUpdates);
    }

    let changeRequest = null;
    if (Object.keys(approvalUpdates).length > 0) {
      if (approvalUpdates.ownerId) {
        const owner = await User.findByPk(approvalUpdates.ownerId);
        if (!owner) throw new BadRequestError('New owner not found');
      }

      changeRequest = await RestaurantChangeRequest.create({
        restaurantId: id,
        requestedBy: requestedBy || item.ownerId,
        payload: approvalUpdates,
        status: 'PENDING',
      });
    }

    return { restaurant: item, changeRequest };
  }

  async deleteRestaurant(id) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    await item.update({ deletedAt: new Date() });
    return item;
  }

  async patchRestaurantStatus(id, isOpen) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    await item.update({ isOpen: Boolean(isOpen) });
    return item;
  }

  async patchRestaurantTodayStatus(id, { isOpenToday, reason, temporaryClosedUntil }) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');

    const updates = {};
    if (isOpenToday !== undefined) updates.isOpenToday = Boolean(isOpenToday);
    if (reason !== undefined) updates.temporaryClosedReason = reason ? String(reason).trim() : null;
    if (temporaryClosedUntil !== undefined)
      updates.temporaryClosedUntil = temporaryClosedUntil ? new Date(temporaryClosedUntil) : null;

    if (Object.keys(updates).length > 0) {
      await item.update(updates);
    }
    return item;
  }

  async patchRestaurantLocation(id, latitude, longitude) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    await item.update({ latitude, longitude });
    return item;
  }

  async listPendingRestaurants() {
    return Restaurant.findAll({
      where: { approvalStatus: 'PENDING', deletedAt: null },
      order: [['id', 'ASC']],
    });
  }

  async approveRestaurant(id, approvedBy) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    if (item.approvalStatus !== 'PENDING') {
      throw new BadRequestError(`Restaurant is already ${item.approvalStatus}`);
    }

    await item.update({
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      isOpen: true,
      isOpenToday: true,
    });
    return item;
  }

  async rejectRestaurant(id, reason) {
    const item = await Restaurant.findOne({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundError('Restaurant not found');
    if (item.approvalStatus !== 'PENDING') {
      throw new BadRequestError(`Restaurant is already ${item.approvalStatus}`);
    }

    await item.update({
      approvalStatus: 'REJECTED',
      rejectReason: reason,
      isOpen: false,
      isOpenToday: false,
    });
    return item;
  }

  async listChangeRequests(status) {
    const where = {};
    if (status) where.status = status;
    return RestaurantChangeRequest.findAll({ where, order: [['id', 'DESC']] });
  }

  async approveChangeRequest(id, reviewedBy) {
    const item = await RestaurantChangeRequest.findByPk(id);
    if (!item) throw new NotFoundError('Change request not found');
    if (item.status !== 'PENDING') {
      throw new BadRequestError(`Change request is already ${item.status}`);
    }

    const restaurant = await Restaurant.findByPk(item.restaurantId);
    if (!restaurant) throw new NotFoundError('Associated restaurant not found');

    await restaurant.update(item.payload);
    await item.update({
      status: 'APPROVED',
      reviewedBy,
      reviewedAt: new Date(),
    });

    return { changeRequest: item, restaurant };
  }

  async rejectChangeRequest(id, reason) {
    const item = await RestaurantChangeRequest.findByPk(id);
    if (!item) throw new NotFoundError('Change request not found');
    if (item.status !== 'PENDING') {
      throw new BadRequestError(`Change request is already ${item.status}`);
    }

    await item.update({
      status: 'REJECTED',
      rejectReason: reason,
    });
    return item;
  }
}

module.exports = new RestaurantService();
