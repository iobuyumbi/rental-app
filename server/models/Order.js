const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
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
    enum: ['Pending', 'Paid', 'Partially Paid'],
    default: 'Pending'
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
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
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