const Client = require('../models/Client');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find().sort({ name: 1 });
  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const client = await Client.create(req.body);
  res.status(201).json({
    success: true,
    data: client
  });
});

module.exports = {
  getClients,
  createClient
};