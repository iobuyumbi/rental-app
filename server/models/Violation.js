const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  violationType: {
    type: String,
    required: [true, 'Violation type is required'],
    enum: ['overdue_return', 'damaged_item', 'missing_item', 'late_payment', 'contract_violation']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  penaltyAmount: {
    type: Number,
    required: [true, 'Penalty amount is required'],
    min: [0, 'Penalty amount cannot be negative']
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedDate: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  waivedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Waived amount cannot be negative']
  },
  resolutionNotes: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'card']
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Violation', violationSchema);