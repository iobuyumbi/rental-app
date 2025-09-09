const express = require('express');
const {
  getWorkers,
  addWorker,
  updateWorker,
  recordAttendance,
  getAttendance,
  calculateRemuneration,
  getRemunerationSummary
} = require('../controllers/casualController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

// Worker management
router.get('/workers', getWorkers);
router.post('/workers', addWorker);
router.put('/workers/:id', updateWorker);

// Attendance management
router.post('/attendance', recordAttendance);
router.get('/attendance', getAttendance);

// Remuneration
router.get('/:id/remuneration', calculateRemuneration);
router.get('/remuneration-summary', getRemunerationSummary);

module.exports = router; 