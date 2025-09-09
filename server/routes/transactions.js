const express = require('express');
const {
  recordPurchase,
  getPurchases,
  recordRepair,
  getRepairs,
  updateRepair,
  getTransactionSummary
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

// Summary
router.get('/summary', getTransactionSummary);

module.exports = router; 