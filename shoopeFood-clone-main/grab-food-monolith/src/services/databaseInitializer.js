const mysql = require('mysql2/promise');
const { DataTypes } = require('sequelize');
const { sequelize, Food } = require('../models');
const seedService = require('./seedService');

const getEnv = (key, fallbackValue) =>
  Object.prototype.hasOwnProperty.call(process.env, key) ? process.env[key] : fallbackValue;

const getDatabaseConfig = () => ({
  database: getEnv('DB_NAME', 'grabfood_db'),
  username: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASSWORD', '123456'),
  host: getEnv('DB_HOST', 'localhost'),
  port: Number(getEnv('DB_PORT', 3306)) || 3306,
});

const quoteIdentifier = (identifier) => {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error('DB_NAME must contain only letters, numbers, and underscores');
  }

  return `\`${identifier}\``;
};

const hasColumn = (columns, columnName) =>
  Object.prototype.hasOwnProperty.call(columns, columnName);

const ensureDatabaseExists = async () => {
  const config = getDatabaseConfig();
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(config.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
};

const ensureFoodQuantityColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('food_items');

  if (!hasColumn(columns, 'default_quantity')) {
    await queryInterface.addColumn('food_items', 'default_quantity', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }

  if (!hasColumn(columns, 'current_quantity')) {
    await queryInterface.addColumn('food_items', 'current_quantity', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }

  if (!hasColumn(columns, 'quantity_reset_date')) {
    await queryInterface.addColumn('food_items', 'quantity_reset_date', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
  }
};

const ensureUsersCreatedAtColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('users');

  if (!hasColumn(columns, 'created_at')) {
    await queryInterface.addColumn('users', 'created_at', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    });
  }
};

const ensureDriverLocationTrackingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('driver_locations');

  if (!hasColumn(columns, 'order_id')) {
    await queryInterface.addColumn('driver_locations', 'order_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
    });
  }

  if (!hasColumn(columns, 'heading')) {
    await queryInterface.addColumn('driver_locations', 'heading', {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    });
  }

  if (!hasColumn(columns, 'speed_kmh')) {
    await queryInterface.addColumn('driver_locations', 'speed_kmh', {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 24,
    });
  }
};

const ensureRestaurantColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('restaurants');

  const addColumn = async (colName, opts) => {
    if (!hasColumn(columns, colName)) {
      await queryInterface.addColumn('restaurants', colName, opts);
    }
  };

  await addColumn('opening_time', {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '07:00:00',
  });
  await addColumn('closing_time', {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '22:00:00',
  });
  await addColumn('is_open', { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true });
  await addColumn('is_open_today', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  });
  await addColumn('temporary_closed_reason', { type: DataTypes.TEXT, allowNull: true });
  await addColumn('temporary_closed_until', { type: DataTypes.DATE, allowNull: true });
  await addColumn('approval_status', {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'PENDING',
  });
  await addColumn('approved_by', { type: DataTypes.INTEGER, allowNull: true });
  await addColumn('approved_at', { type: DataTypes.DATE, allowNull: true });
  await addColumn('reject_reason', { type: DataTypes.TEXT, allowNull: true });
};

const ensureOrderStatusLogsTable = async () => {
  const queryInterface = sequelize.getQueryInterface();
  // Check if table exists; if not, create it (handles DBs not seeded with seed_all.sql)
  try {
    await queryInterface.describeTable('order_status_logs');
  } catch (e) {
    // Table doesn't exist – create it
    await queryInterface.createTable('order_status_logs', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.BIGINT, allowNull: false },
      previous_status: { type: DataTypes.STRING(50), allowNull: true },
      new_status: { type: DataTypes.STRING(50), allowNull: false },
      changed_by: { type: DataTypes.INTEGER, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  }
};

const initializeDatabase = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  // Run all schema migrations BEFORE sync so columns/tables exist when Sequelize creates indexes
  await ensureOrderStatusLogsTable();
  await ensureRestaurantColumns();
  await ensureFoodQuantityColumns();
  await ensureUsersCreatedAtColumn();
  await ensureDriverLocationTrackingColumns();
  await sequelize.sync();
  await Food.resetExpiredDailyQuantities();
  await seedService.seedIfEmpty();
};

module.exports = {
  initializeDatabase,
  ensureDatabaseExists,
  ensureFoodQuantityColumns,
  ensureUsersCreatedAtColumn,
  ensureDriverLocationTrackingColumns,
  ensureOrderStatusLogsTable,
  ensureRestaurantColumns,
};
