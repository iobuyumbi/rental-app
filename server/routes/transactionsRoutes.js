const express = require('express');
const {
  recordPurchase,
  getPurchases,
  recordRepair,
  getRepairs,
  updateRepair,
  getTransactionSummary,
  getLaborCosts,
  getLunchAllowanceCosts
} = require('../controllers/transactionController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

// Purchase routes
router.post('/purchases', recordPurchase);
router.get('/purchases', getPurchases);

// Repair routes
router.post('/repairs', recordRepair);
router.get('/repairs', getRepairs);
router.put('/repairs/:id', updateRepair);

// Labor costs route
router.get('/labor', getLaborCosts);

// Lunch allowance costs route
router.get('/lunch-allowances', getLunchAllowanceCosts);

// Summary
router.get('/summary', getTransactionSummary);

module.exports = router;