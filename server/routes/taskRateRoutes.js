const express = require('express');
const {
  getTaskRates,
  getTaskRate,
  createTaskRate,
  updateTaskRate,
  deleteTaskRate,
  getTaskRatesByType
} = require('../controllers/taskRateController');

const router = express.Router();

// Apply auth middleware to all routes
const { protect } = require('../middleware/auth');
router.use(protect);

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
