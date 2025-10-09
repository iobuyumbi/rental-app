const express = require('express');
const {
  getWorkerTasks,
  getWorkerTask,
  createWorkerTask,
  updateWorkerTask,
  deleteWorkerTask,
  getWorkerEarnings
} = require('../controllers/workerTaskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getWorkerTasks)
  .post(protect, createWorkerTask);

router.route('/earnings')
  .get(protect, getWorkerEarnings);

router.route('/:id')
  .get(protect, getWorkerTask)
  .put(protect, updateWorkerTask)
  .delete(protect, deleteWorkerTask);

module.exports = router;