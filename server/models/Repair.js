const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  repairDate: {
    type: Date,
    default: Date.now
  },
  cost: {
    type: Number,
    required: [true, 'Repair cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  repairedBy: {
    type: String,
    required: [true, 'Repaired by is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Repair', repairSchema); 