const express = require('express');
const {
  getLunchAllowances,
  generateDailyLunchAllowances,
  updateLunchAllowance,
  getLunchAllowanceSummary,
  deleteLunchAllowance
} = require('../controllers/lunchAllowanceController');

const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);
router.use(adminOrAssistant);

// Routes
router.route('/')
  .get(getLunchAllowances);

router.route('/generate')
  .post(generateDailyLunchAllowances);

router.route('/summary')
  .get(getLunchAllowanceSummary);

router.route('/:id')
  .put(updateLunchAllowance)
  .delete(deleteLunchAllowance);

module.exports = router;
