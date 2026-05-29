const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderStatusLog = sequelize.define(
  'OrderStatusLog',
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.BIGINT, allowNull: false, field: 'order_id' },
    previousStatus: { type: DataTypes.STRING(50), field: 'previous_status' },
    newStatus: { type: DataTypes.STRING(50), allowNull: false, field: 'new_status' },
    changedBy: { type: DataTypes.INTEGER, field: 'changed_by' },
    reason: { type: DataTypes.TEXT },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
  },
  {
    tableName: 'order_status_logs',
    timestamps: false,
    indexes: [], // no auto-generated indexes
  }
);

module.exports = OrderStatusLog;
