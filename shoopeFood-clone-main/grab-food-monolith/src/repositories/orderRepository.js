const { Order, User, OrderStatus, Payment } = require("../models");

const orderIncludes = [
  { model: User, as: "customerUser", attributes: ["id", "fullName"] },
  { model: OrderStatus, as: "statusInfo", attributes: ["id", "code", "label"] },
  { model: Payment, as: "payment", attributes: ["id", "paymentMethod", "status", "amount"] },
];

class OrderRepository {
  getIncludes() {
    return orderIncludes;
  }

  create(payload) {
    return Order.create(payload);
  }

  findById(id) {
    return Order.findByPk(Number(id), {
      include: orderIncludes,
    });
  }

  findEntityById(id) {
    return Order.findByPk(Number(id));
  }

  findByIdempotencyKey(idempotencyKey) {
    return Order.findOne({
      where: { idempotencyKey: String(idempotencyKey || "").trim() },
      include: orderIncludes,
    });
  }

  findAll(filters = {}) {
    const { Op } = require("sequelize");
    const where = {};
    if (filters.statusId) {
      where.statusId = filters.statusId;
    }
    if (filters.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }
    if (filters.fromDate && filters.toDate) {
      where.createdAt = {
        [Op.between]: [filters.fromDate, filters.toDate]
      };
    } else if (filters.fromDate) {
      where.createdAt = {
        [Op.gte]: filters.fromDate
      };
    } else if (filters.toDate) {
      where.createdAt = {
        [Op.lte]: filters.toDate
      };
    }

    return Order.findAll({
      where,
      include: orderIncludes,
      order: [["created_at", "DESC"]],
    });
  }

  async update(orderEntity, changes) {
    await orderEntity.update(changes);
    return this.findById(orderEntity.id);
  }

  async save(orderEntity) {
    await orderEntity.save();
    return this.findById(orderEntity.id);
  }

  async delete(orderEntity) {
    await orderEntity.destroy();
    return { id: orderEntity.id };
  }
}

module.exports = new OrderRepository();
