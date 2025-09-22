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
  
  const client = await Client.create(req.body);
  console.log('Client created successfully:', client);
  
  res.status(201).json({
    success: true,
    data: client
  });
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

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient
};