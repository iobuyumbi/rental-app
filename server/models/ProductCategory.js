const mongoose = require('mongoose');

// Define category types for rental business
const CATEGORY_TYPES = ['TENT', 'CHAIR', 'TABLE', 'UTENSIL', 'EQUIPMENT', 'FURNITURE', 'LIGHTING', 'SOUND', 'OTHER'];

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be longer than 50 characters']
  },
  type: {
    type: String,
    enum: {
      values: CATEGORY_TYPES,
      message: 'Invalid category type'
    },
    required: [true, 'Category type is required'],
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rentalPriceMultiplier: {
    type: Number,
    min: [0.1, 'Rental price multiplier must be at least 0.1'],
    default: 1.0
  },
  requiresMaintenance: {
    type: Boolean,
    default: false
  },
  maintenanceIntervalDays: {
    type: Number,
    min: [0, 'Maintenance interval must be a positive number'],
    default: 0
  },
  imageUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Please use a valid URL with HTTP/HTTPS']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);