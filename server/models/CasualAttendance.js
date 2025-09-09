const mongoose = require('mongoose');

const casualAttendanceSchema = new mongoose.Schema({
  casual: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CasualWorker',
    required: [true, 'Casual worker is required']
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
casualAttendanceSchema.index({ casual: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CasualAttendance', casualAttendanceSchema); 