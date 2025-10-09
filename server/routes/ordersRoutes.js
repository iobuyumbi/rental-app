const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  markOrderReturned,
  requestDiscount,
  approveDiscount,
  updatePayment,
  getViolations,
  getViolation,
  createViolation,
  updateViolation,
  resolveViolation,
  bulkResolveViolations,
  deleteViolation,
  exportViolations
} = require('../controllers/orderController');
const { protect, admin, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(protect);
router.use(adminOrAssistant);
router.get('/', getOrders);

// Violation routes (must come before /:id routes)
router.get('/violations/export', exportViolations);
router.get('/violations', getViolations);
router.post('/violations', createViolation);
router.put('/violations/bulk-resolve', bulkResolveViolations);
router.get('/violations/:id', getViolation);
router.put('/violations/:id', updateViolation);
router.put('/violations/:id/resolve', resolveViolation);
router.delete('/violations/:id', deleteViolation);

// Order-specific routes
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/return', markOrderReturned);
router.post('/:id/discount/request', requestDiscount);
router.put('/:id/payment', updatePayment);

// Admin only routes
router.put('/:id/discount/approve', admin, approveDiscount);
router.delete('/:id', admin, deleteOrder);

module.exports = router; 