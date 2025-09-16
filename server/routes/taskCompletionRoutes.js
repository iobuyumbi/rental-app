const express = require('express');
const {
  getTaskCompletions,
  getTaskCompletion,
  recordTaskCompletion,
  updateTaskCompletion,
  verifyTaskCompletion,
  getWorkerTaskSummary
} = require('../controllers/taskCompletionController');

const router = express.Router();

// Apply auth middleware to all routes
const { protect } = require('../middleware/auth');
router.use(protect);

router.route('/')
  .get(getTaskCompletions)
  .post(recordTaskCompletion);

router.route('/worker/:workerId/summary')
  .get(getWorkerTaskSummary);

router.route('/:id')
  .get(getTaskCompletion)
  .put(updateTaskCompletion);

router.route('/:id/verify')
  .put(verifyTaskCompletion);

module.exports = router;
