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
    enum: ['Overdue Return', 'Damaged Item', 'Missing Item', 'Other']
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Violation', violationSchema); 