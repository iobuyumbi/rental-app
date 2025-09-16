const mongoose = require('mongoose');

const taskCompletionSchema = new mongoose.Schema({
  taskRate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskRate',
    required: [true, 'Task rate reference is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  workersPresent: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CasualWorker',
      required: true
    },
    hoursWorked: {
      type: Number,
      default: 0
    }
  }],
  quantityCompleted: {
    type: Number,
    required: [true, 'Quantity completed is required'],
    min: [0, 'Quantity cannot be negative']
  },
  totalPayment: {
    type: Number,
    required: [true, 'Total payment is required'],
    min: [0, 'Payment cannot be negative']
  },
  paymentPerWorker: {
    type: Number,
    required: [true, 'Payment per worker is required'],
    min: [0, 'Payment cannot be negative']
  },
  taskDate: {
    type: Date,
    required: [true, 'Task date is required'],
    default: Date.now
  },
  taskDescription: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'verified', 'paid'],
    default: 'completed'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskCompletionSchema.index({ orderId: 1, taskDate: -1 });
taskCompletionSchema.index({ 'workersPresent.worker': 1, taskDate: -1 });
taskCompletionSchema.index({ taskDate: -1, status: 1 });

// Calculate payment before saving
taskCompletionSchema.pre('save', function(next) {
  if (this.isModified('quantityCompleted') || this.isModified('workersPresent')) {
    const workerCount = this.workersPresent.length;
    if (workerCount > 0) {
      this.paymentPerWorker = this.totalPayment / workerCount;
    }
  }
  next();
});

module.exports = mongoose.model('TaskCompletion', taskCompletionSchema);
