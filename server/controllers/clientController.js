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

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  res.json({
    success: true,
    data: client
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

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  // Check if email is being updated and if it already exists
  if (req.body.email) {
    const existingClient = await Client.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id }
    });

    if (existingClient) {
      res.status(400);
      throw new Error('Email already exists');
    }
  }

  const client = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  res.json({
    success: true,
    data: client
  });
});

// Delete client
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  // Check if client has any orders before deleting
  const Order = require('../models/Order');
  const orderCount = await Order.countDocuments({ client: client._id });

  if (orderCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete client. Client has ${orderCount} associated order(s). Please remove or reassign orders first.`);
  }

  await Client.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Client deleted successfully'
  });
});

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
};