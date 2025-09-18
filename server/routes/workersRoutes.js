const express = require('express');
const {
  getWorkers,
  addWorker,
  updateWorker,
  recordAttendance,
  getAttendance,
  calculateRemuneration,
} = require('../controllers/workerController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

// Worker management
router.get('/', getWorkers);
router.post('/', addWorker);
router.put('/:id', updateWorker);

// Attendance management
router.post('/attendance', recordAttendance);
router.get('/attendance', getAttendance);

// Remuneration
router.get('/:id/remuneration', calculateRemuneration);
module.exports = router;