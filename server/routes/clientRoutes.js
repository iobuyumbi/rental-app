const express = require('express');
const router = express.Router();
const {
  getClients,
  createClient
} = require('../controllers/clientController');
const { protect, adminOrAssistant } = require('../middleware/auth');

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

router.route('/')
  .get(getClients)
  .post(createClient);

module.exports = router;