const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  markOrderReturned,
  requestDiscount,
  approveDiscount,
  updatePayment,
  getViolations,
  resolveViolation
} = require('../controllers/orderController');
const { protect, admin, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(protect);
router.use(adminOrAssistant);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/return', markOrderReturned);
router.post('/:id/discount/request', requestDiscount);
router.put('/:id/payment', updatePayment);

// Admin only routes
router.put('/:id/discount/approve', admin, approveDiscount);

// Violation routes
router.get('/violations', getViolations);
router.put('/violations/:id/resolve', resolveViolation);

module.exports = router; 