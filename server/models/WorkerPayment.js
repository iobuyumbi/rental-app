const mongoose = require('mongoose');

const workerPaymentSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Worker reference is required']
  },
  paymentPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Payment period start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Payment period end date is required']
    }
  },
  taskCompletions: [{
    taskCompletion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskCompletion',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  bonuses: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  deductions: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
workerPaymentSchema.index({ worker: 1, 'paymentPeriod.startDate': -1 });
workerPaymentSchema.index({ status: 1, createdAt: -1 });

// Calculate final amount before saving
workerPaymentSchema.pre('save', function(next) {
  const bonusTotal = this.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const deductionTotal = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  this.finalAmount = this.totalAmount + bonusTotal - deductionTotal;
  next();
});

module.exports = mongoose.model('WorkerPayment', workerPaymentSchema);
