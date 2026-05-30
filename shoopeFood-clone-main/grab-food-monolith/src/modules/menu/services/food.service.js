const { Op } = require('sequelize');
const { Food, Category } = require('../../../models');
const { NotFoundError, BadRequestError } = require('../../../common/errors');

class FoodService {
  async getAllFoods({ restaurantId, categoryId, name, isAvailable }) {
    await Food.resetExpiredDailyQuantities();

    const whereClause = {};
    if (categoryId !== undefined) whereClause.categoryId = categoryId;
    if (name) whereClause.name = { [Op.like]: `%${name}%` };
    if (isAvailable !== undefined) whereClause.isAvailable = String(isAvailable) === 'true';

    const includeOptions = [];
    if (restaurantId !== undefined) {
      includeOptions.push({
        model: Category,
        as: 'category',
        where: { restaurantId },
        attributes: [],
      });
    }

    return Food.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['id', 'ASC']],
    });
  }

  async getFoodById(id) {
    await Food.resetExpiredDailyQuantities();
    const item = await Food.findByPk(id);
    if (!item) throw new NotFoundError('Food not found');
    return item;
  }

  async createFood(payload) {
    let { categoryId, currentQuantity, defaultQuantity } = payload;

    if (categoryId !== undefined && categoryId !== null) {
      const category = await Category.findByPk(categoryId);
      if (!category) throw new BadRequestError('Category not found');
    }

    return Food.create({
      ...payload,
      currentQuantity: currentQuantity ?? defaultQuantity,
      quantityResetDate: Food.getStockDate(),
    });
  }

  async updateFood(id, payload) {
    await Food.resetExpiredDailyQuantities();

    const item = await Food.findByPk(id);
    if (!item) throw new NotFoundError('Food not found');

    const { categoryId, defaultQuantity, currentQuantity } = payload;

    let nextCategoryId = item.categoryId;
    if (categoryId !== undefined) {
      if (categoryId === null) {
        nextCategoryId = null;
      } else {
        if (categoryId !== item.categoryId) {
          const category = await Category.findByPk(categoryId);
          if (!category) throw new BadRequestError('Category not found');
        }
        nextCategoryId = categoryId;
      }
    }

    let nextCurrentQuantity = item.currentQuantity || 0;
    if (currentQuantity !== undefined) {
      nextCurrentQuantity = currentQuantity;
    } else if (defaultQuantity !== undefined) {
      nextCurrentQuantity = defaultQuantity;
    }

    await item.update({
      ...payload,
      categoryId: nextCategoryId,
      currentQuantity: nextCurrentQuantity,
      quantityResetDate: item.quantityResetDate || Food.getStockDate(),
    });

    return item;
  }

  async deleteFood(id) {
    const item = await Food.findByPk(id);
    if (!item) throw new NotFoundError('Food not found');
    await item.destroy();
    return item;
  }
}

module.exports = new FoodService();
