const express = require('express');
const router = express.Router();
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { protect, adminOrAssistant } = require('../middleware/auth');

// All routes are protected
router.use(protect);
router.use(adminOrAssistant);

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;