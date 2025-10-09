const mongoose = require('mongoose');

const workerTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  taskType: {
    type: String,
    enum: ['issuing', 'receiving', 'loading', 'unloading', 'other'],
    required: [true, 'Task type is required']
  },
  workers: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker is required']
    },
    present: {
      type: Boolean,
      default: true
    }
  }],
  taskAmount: {
    type: Number,
    required: [true, 'Task amount is required'],
    min: [0, 'Task amount cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate share per worker
workerTaskSchema.virtual('sharePerWorker').get(function() {
  const presentWorkers = this.workers.filter(w => w.present).length;
  return presentWorkers > 0 ? this.taskAmount / presentWorkers : 0;
});

// Ensure virtuals are serialized
workerTaskSchema.set('toJSON', { virtuals: true });
workerTaskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkerTask', workerTaskSchema);