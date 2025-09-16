const Client = require('../models/Client');
const asyncHandler = require('../middleware/asyncHandler');

exports.getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find().sort({ name: 1 });
  res.json({
    success: true,
    count: clients.length,
    data: clients
  });
});

exports.createClient = asyncHandler(async (req, res) => {
  const client = await Client.create(req.body);
  res.status(201).json({
    success: true,
    data: client
  });
});