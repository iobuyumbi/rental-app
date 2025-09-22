const asyncHandler = require('../middleware/asyncHandler');
const Worker = require('../models/Worker');
const WorkerAttendance = require('../models/WorkersAttendance');

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private
const getWorkers = asyncHandler(async (req, res) => {
  const workers = await Worker.find({ active: true });
  res.json({
    success: true,
    count: workers.length,
    data: workers
  });
});

// @desc    Add new worker
// @route   POST /api/workers
// @access  Private
const addWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.create(req.body);
  res.status(201).json({
    success: true,
    data: worker
  });
});

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private
const updateWorker = asyncHandler(async (req, res) => {
  let worker = await Worker.findById(req.params.id);
  
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }
  
  worker = await Worker.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.json({
    success: true,
    data: worker
  });
});

// @desc    Record attendance
// @route   POST /api/workers/attendance
// @access  Private
const recordAttendance = asyncHandler(async (req, res) => {
  const { worker, date, order, activities, hoursWorked, notes } = req.body;

  // Check for existing attendance for the worker on the same day
  const existingAttendance = await WorkerAttendance.findOne({
    worker,
    date: {
      $gte: new Date(date).setHours(0, 0, 0, 0),
      $lt: new Date(date).setHours(23, 59, 59, 999)
    }
  });

  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already recorded for this worker today'
    });
  }

  const attendance = await WorkerAttendance.create({
    worker,
    date,
    order,
    activities,
    hoursWorked,
    notes
  });

  const populatedAttendance = await WorkerAttendance.findById(attendance._id)
    .populate('worker', 'name ratePerHour standardDailyRate')
    .populate('order', 'orderNumber client orderDate');
  
  res.status(201).json({
    success: true,
    data: populatedAttendance
  });
});

// @desc    Get attendance records
// @route   GET /api/workers/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const { date, worker, startDate, endDate } = req.query;
  
  let query = {};
  
  if (worker) {
    query.worker = worker;
  }
  
  if (date) {
    query.date = new Date(date);
  }
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const attendance = await WorkerAttendance.find(query)
    .populate('worker', 'name ratePerHour standardDailyRate')
    .populate('order', 'orderNumber client orderDate')
    .sort({ date: -1 });
  
  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Calculate remuneration for a worker
// @route   GET /api/workers/:id/remuneration
// @access  Private
const calculateRemuneration = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }
  
  const worker = await Worker.findById(req.params.id);
  
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }
  
  const attendance = await WorkerAttendance.find({
    worker: req.params.id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('order', 'client orderDate');
  
  let totalRemuneration = 0;
  let totalDays = 0;
  let totalHours = 0;
  
  for (const record of attendance) {
    totalDays++;
    
    if (record.hoursWorked) {
      totalHours += record.hoursWorked;
      totalRemuneration += record.hoursWorked * worker.ratePerHour;
    } else {
      // If no hours specified, use standard daily rate
      totalRemuneration += worker.standardDailyRate;
    }
  }
  
  res.json({
    success: true,
    data: {
      worker: {
        _id: worker._id,
        name: worker.name,
        ratePerHour: worker.ratePerHour,
        standardDailyRate: worker.standardDailyRate
      },
      period: {
        startDate,
        endDate
      },
      summary: {
        totalDays,
        totalHours,
        totalRemuneration
      },
      attendance: attendance
    }
  });
});

module.exports = {
  getWorkers,
  addWorker,
  updateWorker,
  recordAttendance,
  getAttendance,
  calculateRemuneration,
}; 