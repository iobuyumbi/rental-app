const mongoose = require('mongoose');

const lunchAllowanceSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CasualWorker',
    required: true
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CasualAttendance',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100, // Minimum KES 100
    default: 100
  },
  status: {
    type: String,
    enum: ['Pending', 'Provided', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  providedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  providedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
lunchAllowanceSchema.index({ workerId: 1, date: 1 });
lunchAllowanceSchema.index({ date: 1, status: 1 });

// Ensure one lunch allowance per worker per day
lunchAllowanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LunchAllowance', lunchAllowanceSchema);
