const express = require('express');
const { authRoutes } = require('../modules/auth');
const { userRoutes } = require('../modules/users');
const { driverRoutes } = require('../modules/drivers');
const { orderRoutes, orderStatusRoutes } = require('../modules/orders');
const { restaurantRoutes } = require('../modules/restaurants');
const { categoryRoutes, foodRoutes } = require('../modules/menu');
const { paymentRoutes } = require('../modules/payments');

const router = express.Router();

// ─── Pages ───────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.render('home', { title: 'GrabFood Monolith' });
});

router.get('/map', (req, res) => {
  res.render('map');
});

router.get('/foods-crud', (req, res) => {
  res.render('foods-crud');
});

router.get('/categories-crud', (req, res) => {
  res.render('categories-crud');
});

// Dashboard pages: HTML public, JS inside redirects to /dashboard-login if no token.
// API routes enforce auth – these pages only render the shell.
router.get('/dashboard-login', (req, res) => {
  res.render('dashboard-login', { title: 'Dashboard Login' });
});

router.get('/orders-dashboard', (req, res) => {
  res.render('orders-dashboard', { title: 'Orders Dashboard' });
});

// ─── Public API ───────────────────────────────────────────────────────────────
// Order statuses (no auth needed – not sensitive data)
router.use('/api/order-statuses', orderStatusRoutes);

// ─── Auth & Domain APIs ───────────────────────────────────────────────────────
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/drivers', driverRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/restaurants', restaurantRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/foods', foodRoutes);
router.use('/api/payments', paymentRoutes);

module.exports = router;
