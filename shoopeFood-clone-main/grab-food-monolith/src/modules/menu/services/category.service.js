const { Category, Restaurant, Food } = require('../../../models');
const { NotFoundError, BadRequestError, ConflictError } = require('../../../common/errors');

class CategoryService {
  async getAllCategories(restaurantId) {
    const whereClause = {};
    if (restaurantId !== undefined) {
      whereClause.restaurantId = restaurantId;
    }
    return Category.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
    });
  }

  async getCategoryById(id) {
    const item = await Category.findByPk(id);
    if (!item) throw new NotFoundError('Category not found');
    return item;
  }

  async createCategory(payload) {
    const restaurant = await Restaurant.findByPk(payload.restaurantId);
    if (!restaurant) throw new BadRequestError('Restaurant not found');

    return Category.create({
      restaurantId: payload.restaurantId,
      name: payload.name,
    });
  }

  async updateCategory(id, payload) {
    const item = await Category.findByPk(id);
    if (!item) throw new NotFoundError('Category not found');

    if (!payload.name && payload.restaurantId === undefined) {
      throw new BadRequestError('Nothing to update');
    }

    let nextRestaurantId = item.restaurantId;
    if (payload.restaurantId !== undefined && payload.restaurantId !== item.restaurantId) {
      const restaurant = await Restaurant.findByPk(payload.restaurantId);
      if (!restaurant) throw new BadRequestError('Restaurant not found');
      nextRestaurantId = payload.restaurantId;
    }

    await item.update({
      name: payload.name || item.name,
      restaurantId: nextRestaurantId,
    });
    return item;
  }

  async deleteCategory(id) {
    const item = await Category.findByPk(id);
    if (!item) throw new NotFoundError('Category not found');

    const foodCount = await Food.count({ where: { categoryId: id } });
    if (foodCount > 0) {
      throw new ConflictError('Cannot delete category containing food items');
    }

    await item.destroy();
    return item;
  }
}

module.exports = new CategoryService();
