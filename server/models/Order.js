const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  orderCompany: {
    type: String,
    trim: true,
    default: ''
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  rentalStartDate: {
    type: Date,
    required: [true, 'Rental start date is required']
  },
  rentalEndDate: {
    type: Date,
    required: [true, 'Rental end date is required']
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  actualReturnDate: {
    type: Date
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid'],
    default: 'pending'
  },
  discountApplied: {
    type: Boolean,
    default: false
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  discountApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    required: false // Optional field for delivery/pickup location
  }
}, {
  timestamps: true
});

// Virtual for remaining amount
orderSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.amountPaid;
});

// Ensure virtuals are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema); 