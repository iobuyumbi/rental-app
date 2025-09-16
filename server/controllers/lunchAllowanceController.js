const asyncHandler = require('../middleware/asyncHandler');
const LunchAllowance = require('../models/LunchAllowance');
const CasualAttendance = require('../models/WorkersAttendance');
const CasualWorker = require('../models/Worker');

// @desc    Get all lunch allowances
// @route   GET /api/lunch-allowances
// @access  Private
const getLunchAllowances = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, workerId } = req.query;
  
  let filter = {};
  
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (workerId) {
    filter.workerId = workerId;
  }
  
  const allowances = await LunchAllowance.find(filter)
    .populate('workerId', 'name phone')
    .populate('attendanceId', 'hoursWorked taskDescription')
    .populate('providedBy', 'name')
    .sort({ date: -1 });
  
  res.json({
    success: true,
    count: allowances.length,
    data: allowances
  });
});

// @desc    Create lunch allowances for present workers
// @route   POST /api/lunch-allowances/generate
// @access  Private
const generateDailyLunchAllowances = asyncHandler(async (req, res) => {
  const { date, amount = 100 } = req.body;
  
  if (!date) {
    res.status(400);
    throw new Error('Date is required');
  }
  
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
  
  // Find all present workers for the date
  const presentWorkers = await CasualAttendance.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'Present'
  }).populate('workerId');
  
  if (presentWorkers.length === 0) {
    return res.json({
      success: true,
      message: 'No present workers found for the specified date',
      data: []
    });
  }
  
  const allowances = [];
  
  for (const attendance of presentWorkers) {
    // Check if lunch allowance already exists
    const existingAllowance = await LunchAllowance.findOne({
      workerId: attendance.workerId._id,
      date: startOfDay
    });
    
    if (!existingAllowance) {
      const allowance = await LunchAllowance.create({
        workerId: attendance.workerId._id,
        attendanceId: attendance._id,
        date: startOfDay,
        amount: Math.max(amount, 100) // Ensure minimum 100
      });
      
      const populatedAllowance = await LunchAllowance.findById(allowance._id)
        .populate('workerId', 'name phone')
        .populate('attendanceId', 'hoursWorked taskDescription');
      
      allowances.push(populatedAllowance);
    }
  }
  
  res.status(201).json({
    success: true,
    message: `Generated ${allowances.length} lunch allowances`,
    data: allowances
  });
});

// @desc    Update lunch allowance status
// @route   PUT /api/lunch-allowances/:id
// @access  Private
const updateLunchAllowance = asyncHandler(async (req, res) => {
  const { status, amount, notes } = req.body;
  
  let allowance = await LunchAllowance.findById(req.params.id);
  
  if (!allowance) {
    res.status(404);
    throw new Error('Lunch allowance not found');
  }
  
  const updateData = {};
  
  if (status) {
    updateData.status = status;
    if (status === 'Provided') {
      updateData.providedBy = req.user.id;
      updateData.providedAt = new Date();
    }
  }
  
  if (amount !== undefined) {
    updateData.amount = Math.max(amount, 100); // Ensure minimum 100
  }
  
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  
  allowance = await LunchAllowance.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('workerId', 'name phone')
   .populate('attendanceId', 'hoursWorked taskDescription')
   .populate('providedBy', 'name');
  
  res.json({
    success: true,
    data: allowance
  });
});

// @desc    Get lunch allowance summary
// @route   GET /api/lunch-allowances/summary
// @access  Private
const getLunchAllowanceSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let matchStage = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const summary = await LunchAllowance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  const totalSummary = await LunchAllowance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      byStatus: summary,
      total: totalSummary[0] || { totalCount: 0, totalAmount: 0, averageAmount: 0 }
    }
  });
});

// @desc    Delete lunch allowance
// @route   DELETE /api/lunch-allowances/:id
// @access  Private
const deleteLunchAllowance = asyncHandler(async (req, res) => {
  const allowance = await LunchAllowance.findById(req.params.id);
  
  if (!allowance) {
    res.status(404);
    throw new Error('Lunch allowance not found');
  }
  
  if (allowance.status === 'Provided') {
    res.status(400);
    throw new Error('Cannot delete a provided lunch allowance');
  }
  
  await allowance.deleteOne();
  
  res.json({
    success: true,
    message: 'Lunch allowance deleted successfully'
  });
});

module.exports = {
  getLunchAllowances,
  generateDailyLunchAllowances,
  updateLunchAllowance,
  getLunchAllowanceSummary,
  deleteLunchAllowance
};
