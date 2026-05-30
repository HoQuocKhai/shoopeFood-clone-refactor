const { User, Restaurant, Role } = require('../../../models');
const { BadRequestError } = require('../../../common/errors');

class OrderValidationService {
  /**
   * Assert user exists and has CUSTOMER role.
   * @param {number} customerId
   * @returns {Promise<import('sequelize').Model>} user instance
   */
  async assertCustomerExists(customerId) {
    const user = await User.findByPk(Number(customerId), {
      include: [
        { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });

    if (!user) {
      throw new BadRequestError('Customer not found');
    }

    const roleNames = (user.roles || []).map((r) => r.name);
    if (!roleNames.includes('CUSTOMER')) {
      throw new BadRequestError('User does not have CUSTOMER role');
    }

    return user;
  }

  /**
   * Assert restaurant exists, is open, and is approved.
   * @param {number} restaurantId
   * @returns {Promise<import('sequelize').Model>} restaurant instance
   */
  async assertRestaurantOpen(restaurantId) {
    const restaurant = await Restaurant.findByPk(Number(restaurantId));

    if (!restaurant) {
      throw new BadRequestError('Restaurant not found');
    }

    if (!restaurant.isOpen) {
      throw new BadRequestError('Restaurant is currently closed');
    }

    if (restaurant.approvalStatus && restaurant.approvalStatus !== 'APPROVED') {
      throw new BadRequestError('Restaurant is not approved for orders');
    }

    return restaurant;
  }
}

module.exports = new OrderValidationService();
