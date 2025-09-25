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
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
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
  console.log('Creating client with data:', req.body);
  
  try {
    const client = await Client.create(req.body);
    console.log('Client created successfully:', client);
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Client creation error:', error);
    
    if (error.code === 11000) {
      // Handle duplicate key error (unique constraint violation)
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'email' ? 'Email' : field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(400).json({
        success: false,
        message: `${fieldName} already exists. Please use a different ${field}.`
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating client'
    });
  }
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  try {
    // Check if email is being updated and if it already exists
    if (req.body.email) {
      const existingClient = await Client.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
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
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Client update error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating client'
    });
  }
});

// Delete client
const deleteClient = asyncHandler(async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Check if client has any orders before deleting
    const Order = require('../models/Order');
    const orderCount = await Order.countDocuments({ client: client._id });
    
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client. Client has ${orderCount} associated order(s). Please remove or reassign orders first.`
      });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Client deletion error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error deleting client'
    });
  }
});

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
};