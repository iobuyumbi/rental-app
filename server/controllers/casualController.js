const asyncHandler = require('../middleware/asyncHandler');
const CasualWorker = require('../models/CasualWorker');
const CasualAttendance = require('../models/CasualAttendance');

// @desc    Get all casual workers
// @route   GET /api/casuals/workers
// @access  Private
const getWorkers = asyncHandler(async (req, res) => {
  const workers = await CasualWorker.find({ active: true });
  res.json({
    success: true,
    count: workers.length,
    data: workers
  });
});

// @desc    Add new casual worker
// @route   POST /api/casuals/workers
// @access  Private
const addWorker = asyncHandler(async (req, res) => {
  const worker = await CasualWorker.create(req.body);
  res.status(201).json({
    success: true,
    data: worker
  });
});

// @desc    Update casual worker
// @route   PUT /api/casuals/workers/:id
// @access  Private
const updateWorker = asyncHandler(async (req, res) => {
  let worker = await CasualWorker.findById(req.params.id);
  
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }
  
  worker = await CasualWorker.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.json({
    success: true,
    data: worker
  });
});

// @desc    Record attendance
// @route   POST /api/casuals/attendance
// @access  Private
const recordAttendance = asyncHandler(async (req, res) => {
  const { casual, date, order, activities, hoursWorked, notes } = req.body;
  
  // Check if attendance already exists for this worker on this date
  const existingAttendance = await CasualAttendance.findOne({
    casual,
    date: new Date(date)
  });
  
  if (existingAttendance) {
    res.status(400);
    throw new Error('Attendance already recorded for this worker on this date');
  }
  
  const attendance = await CasualAttendance.create({
    casual,
    date: new Date(date),
    order,
    activities,
    hoursWorked,
    notes
  });
  
  const populatedAttendance = await CasualAttendance.findById(attendance._id)
    .populate('casual', 'name ratePerHour standardDailyRate')
    .populate('order', 'client orderDate');
  
  res.status(201).json({
    success: true,
    data: populatedAttendance
  });
});

// @desc    Get attendance records
// @route   GET /api/casuals/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const { date, worker, startDate, endDate } = req.query;
  
  let query = {};
  
  if (worker) {
    query.casual = worker;
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

  const attendance = await CasualAttendance.find(query)
    .populate('casual', 'name ratePerHour standardDailyRate')
    .populate('order', 'client orderDate')
    .sort({ date: -1 });
  
  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Calculate remuneration for a worker
// @route   GET /api/casuals/:id/remuneration
// @access  Private
const calculateRemuneration = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }
  
  const worker = await CasualWorker.findById(req.params.id);
  
  if (!worker) {
    res.status(404);
    throw new Error('Worker not found');
  }
  
  const attendance = await CasualAttendance.find({
    casual: req.params.id,
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

// @desc    Get remuneration summary for all workers
// @route   GET /api/casuals/remuneration-summary
// @access  Private
const getRemunerationSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }
  
  const workers = await CasualWorker.find({ active: true });
  const summary = [];
  
  for (const worker of workers) {
    const attendance = await CasualAttendance.find({
      casual: worker._id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    let totalRemuneration = 0;
    let totalDays = 0;
    let totalHours = 0;
    
    for (const record of attendance) {
      totalDays++;
      
      if (record.hoursWorked) {
        totalHours += record.hoursWorked;
        totalRemuneration += record.hoursWorked * worker.ratePerHour;
      } else {
        totalRemuneration += worker.standardDailyRate;
      }
    }
    
    summary.push({
      worker: {
        _id: worker._id,
        name: worker.name,
        ratePerHour: worker.ratePerHour,
        standardDailyRate: worker.standardDailyRate
      },
      summary: {
        totalDays,
        totalHours,
        totalRemuneration
      }
    });
  }
  
  const totalRemuneration = summary.reduce((sum, item) => sum + item.summary.totalRemuneration, 0);
  
  res.json({
    success: true,
    data: {
      period: {
        startDate,
        endDate
      },
      totalRemuneration,
      workers: summary
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
  getRemunerationSummary
}; 