const express = require('express');
const {
  generateInvoice,
  generateReceipt,
  getDiscountApprovals,
  getWorkerRemunerationSummary,
  getInventoryStatus,
  getOverdueReturns
} = require('../controllers/reportController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

// Invoice and receipt generation
router.get('/invoices/:orderId', generateInvoice);
router.get('/receipts/:orderId', generateReceipt);

// Reports
router.get('/discount-approvals', getDiscountApprovals);
router.get('/worker-remuneration-summary', getWorkerRemunerationSummary);
router.get('/inventory-status', getInventoryStatus);
router.get('/overdue-returns', getOverdueReturns);

module.exports = router; 