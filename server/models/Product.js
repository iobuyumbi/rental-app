const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: [true, 'Category is required'],
    index: true
  },
  rentalPrice: {
    type: Number,
    required: [true, 'Rental price is required'],
    min: [0, 'Rental price cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  quantityInStock: {
    type: Number,
    required: [true, 'Quantity in stock is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  quantityRented: {
    type: Number,
    default: 0,
    min: [0, 'Quantity rented cannot be negative']
  },
  condition: {
    type: String,
    enum: ['Good', 'Fair', 'Needs Repair'],
    default: 'Good'
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for available quantity
productSchema.virtual('availableQuantity').get(function() {
  return this.quantityInStock - this.quantityRented;
});

// Ensure virtuals are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema); 