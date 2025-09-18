const express = require('express');
const {
  getTaskRates,
  getTaskRate,
  createTaskRate,
  updateTaskRate,
  deleteTaskRate,
  getTaskRatesByType
} = require('../controllers/taskRateController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

router.route('/')
  .get(getTaskRates)
  .post(createTaskRate);

router.route('/by-type/:taskType')
  .get(getTaskRatesByType);

router.route('/:id')
  .get(getTaskRate)
  .put(updateTaskRate)
  .delete(deleteTaskRate);

module.exports = router;
