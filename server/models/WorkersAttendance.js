const mongoose = require('mongoose');

const workerAttendanceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Worker is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  activities: [{
    type: String,
    enum: ['Store Removal', 'Vehicle Loading', 'Site Setup/Pitching', 'Site Dismantling', 'Vehicle Unloading', 'Store Return'],
    required: [true, 'At least one activity is required']
  }],
  hoursWorked: {
    type: Number,
    min: [0, 'Hours worked cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure unique attendance per worker per day
workerAttendanceSchema.index({ worker: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkerAttendance', workerAttendanceSchema);