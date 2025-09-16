const mongoose = require('mongoose');

const taskRateSchema = new mongoose.Schema({
  taskType: {
    type: String,
    required: [true, 'Task type is required'],
    enum: ['dispatch', 'loading', 'receiving', 'cleaning', 'setup', 'breakdown', 'delivery', 'pickup'],
    trim: true
  },
  taskName: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true
  },
  ratePerUnit: {
    type: Number,
    required: [true, 'Rate per unit is required'],
    min: [0, 'Rate cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true // e.g., 'per chair', 'per tent', 'per load', 'per item'
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskRateSchema.index({ taskType: 1, active: 1 });

module.exports = mongoose.model('TaskRate', taskRateSchema);
