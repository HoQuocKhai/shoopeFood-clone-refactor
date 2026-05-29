const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const driverRoutes = require('./driverRoutes');
const orderRoutes = require('./orderRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const categoryRoutes = require('./categoryRoutes');
const foodRoutes = require('./foodRoutes');
const paymentRoutes = require('./paymentRoutes');
const orderStatusController = require('../controllers/orderStatusController');

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
router.get('/api/order-statuses', orderStatusController.getAll);
router.get('/api/order-statuses/transitions', orderStatusController.getTransitions);

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
