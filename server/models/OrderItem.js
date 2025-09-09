const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantityRented: {
    type: Number,
    required: [true, 'Quantity rented is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPriceAtTimeOfRental: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  }
}, {
  timestamps: true
});

// Virtual for total price of this item
orderItemSchema.virtual('totalPrice').get(function() {
  return this.quantityRented * this.unitPriceAtTimeOfRental;
});

// Ensure virtuals are serialized
orderItemSchema.set('toJSON', { virtuals: true });
orderItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('OrderItem', orderItemSchema); 