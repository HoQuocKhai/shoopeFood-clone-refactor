const { DriverDetail, DriverLocation, Order, User, sequelize } = require('../../../models');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { socketManager } = require('../../tracking');

const driverInclude = [{ model: User, as: 'driverUser' }];

class DriverService {
  async getAllDrivers() {
    return DriverDetail.findAll({ include: driverInclude, order: [['userId', 'ASC']] });
  }

  async getDriverById(id) {
    const item = await DriverDetail.findByPk(id, { include: driverInclude });
    if (!item) throw new NotFoundError('Driver not found');
    return item;
  }

  async createDriver(payload) {
    const {
      fullName,
      phone,
      password = '123456',
      ratingAvg,
      vehicleType,
      licensePlate,
      isOnline,
    } = payload;

    return sequelize.transaction(async (t) => {
      const newUser = await User.create(
        {
          fullName,
          phone,
          password,
          ratingAvg,
        },
        { transaction: t }
      );

      const newDriver = await DriverDetail.create(
        {
          userId: newUser.id,
          vehicleType,
          licensePlate,
          isOnline,
        },
        { transaction: t }
      );

      newDriver.driverUser = newUser;
      return newDriver;
    });
  }

  async updateDriver(id, payload) {
    const { fullName, phone, password, ratingAvg, vehicleType, licensePlate, isOnline } = payload;

    return sequelize.transaction(async (t) => {
      const driver = await DriverDetail.findByPk(id, { include: driverInclude, transaction: t });
      if (!driver) throw new NotFoundError('Driver not found');

      const user = driver.driverUser;
      if (!user) throw new NotFoundError('Associated User not found');

      const userUpdates = {};
      if (fullName !== undefined) userUpdates.fullName = fullName;
      if (phone !== undefined) userUpdates.phone = phone;
      if (password !== undefined) userUpdates.password = password;
      if (ratingAvg !== undefined) userUpdates.ratingAvg = ratingAvg;

      if (Object.keys(userUpdates).length > 0) {
        await user.update(userUpdates, { transaction: t });
      }

      const driverUpdates = {};
      if (vehicleType !== undefined) driverUpdates.vehicleType = vehicleType;
      if (licensePlate !== undefined) driverUpdates.licensePlate = licensePlate;
      if (isOnline !== undefined) driverUpdates.isOnline = isOnline;

      if (Object.keys(driverUpdates).length > 0) {
        await driver.update(driverUpdates, { transaction: t });
      }

      return driver;
    });
  }

  async deleteDriver(id) {
    return sequelize.transaction(async (t) => {
      const driver = await DriverDetail.findByPk(id, { transaction: t });
      if (!driver) throw new NotFoundError('Driver not found');

      const user = await User.findByPk(driver.userId, { transaction: t });
      if (!user) throw new NotFoundError('Associated User not found');

      await driver.destroy({ transaction: t });
      await user.destroy({ transaction: t });

      driver.driverUser = user;
      return driver;
    });
  }

  async updateDriverLocation(id, payload) {
    const driver = await DriverDetail.findByPk(id);
    if (!driver) throw new NotFoundError('Driver not found');

    const { orderId, latitude, longitude, heading, speedKmh } = payload;

    let parsedOrderId = null;
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order) throw new BadRequestError('Order not found');
      parsedOrderId = orderId;
    }

    const loc = await DriverLocation.create({
      driverId: id,
      orderId: parsedOrderId,
      latitude,
      longitude,
      heading,
      speedKmh,
    });

    try {
      const io = socketManager.getIO();
      io.emit('driver:location', {
        driverId: id,
        orderId: parsedOrderId,
        latitude,
        longitude,
        heading,
        speedKmh,
      });
    } catch (err) {
      console.warn('Socket emit failed:', err.message);
    }

    return loc;
  }

  async updateOnlineStatus(id, isOnline) {
    const driver = await DriverDetail.findByPk(id, { include: driverInclude });
    if (!driver) throw new NotFoundError('Driver not found');

    await driver.update({ isOnline });
    return driver;
  }
}

module.exports = new DriverService();
