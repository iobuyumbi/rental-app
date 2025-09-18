const express = require('express');
const {
  getTaskCompletions,
  getTaskCompletion,
  recordTaskCompletion,
  updateTaskCompletion,
  verifyTaskCompletion,
  getWorkerTaskSummary
} = require('../controllers/taskCompletionController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

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
