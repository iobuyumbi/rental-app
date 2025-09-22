const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Worker name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  ratePerHour: {
    type: Number,
    required: [true, 'Rate per hour is required'],
    min: [0, 'Rate cannot be negative']
  },
  standardDailyRate: {
    type: Number,
    required: [true, 'Standard daily rate is required'],
    min: [0, 'Daily rate cannot be negative']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Worker', workerSchema);