const categoryRoutes = require('./routes/category.routes');
const categoryController = require('./controllers/category.controller');
const categoryService = require('./services/category.service');

const foodRoutes = require('./routes/food.routes');
const foodController = require('./controllers/food.controller');
const foodService = require('./services/food.service');

module.exports = {
  categoryRoutes,
  categoryController,
  categoryService,
  foodRoutes,
  foodController,
  foodService,
};
