const asyncHandler = require('../middleware/asyncHandler');
const TaskCompletion = require('../models/TaskCompletion');
const TaskRate = require('../models/TaskRate');
const Worker = require('../models/Worker');

// @desc    Get all task completions
// @route   GET /api/task-completions
// @access  Private
const getTaskCompletions = asyncHandler(async (req, res) => {
  const { orderId, workerId, startDate, endDate, status } = req.query;
  
  let filter = {};
  if (orderId) filter.orderId = orderId;
  if (workerId) filter['workersPresent.worker'] = workerId;
  if (status) filter.status = status;
  
  if (startDate || endDate) {
    filter.taskDate = {};
    if (startDate) filter.taskDate.$gte = new Date(startDate);
    if (endDate) filter.taskDate.$lte = new Date(endDate);
  }

  const taskCompletions = await TaskCompletion.find(filter)
    .populate('taskRate', 'taskName taskType ratePerUnit unit')
    .populate('orderId', 'orderNumber clientName')
    .populate('workersPresent.worker', 'name phone')
    .populate('verifiedBy', 'name email')
    .sort({ taskDate: -1 });

  res.json({
    success: true,
    count: taskCompletions.length,
    data: taskCompletions
  });
});

// @desc    Get single task completion
// @route   GET /api/task-completions/:id
// @access  Private
const getTaskCompletion = asyncHandler(async (req, res) => {
  const taskCompletion = await TaskCompletion.findById(req.params.id)
    .populate('taskRate', 'taskName taskType ratePerUnit unit description')
    .populate('orderId', 'orderNumber clientName eventDate')
    .populate('workersPresent.worker', 'name phone ratePerHour')
    .populate('verifiedBy', 'name email');

  if (!taskCompletion) {
    res.status(404);
    throw new Error('Task completion not found');
  }

  res.json({
    success: true,
    data: taskCompletion
  });
});

// @desc    Record new task completion
// @route   POST /api/task-completions
// @access  Private
const recordTaskCompletion = asyncHandler(async (req, res) => {
  const { taskRateId, orderId, workersPresent, quantityCompleted, taskDescription } = req.body;

  // Get task rate to calculate payment
  const taskRate = await TaskRate.findById(taskRateId);
  if (!taskRate) {
    res.status(404);
    throw new Error('Task rate not found');
  }

  // Calculate total payment
  const totalPayment = quantityCompleted * taskRate.ratePerUnit;
  const paymentPerWorker = workersPresent.length > 0 ? totalPayment / workersPresent.length : 0;

  const taskCompletion = await TaskCompletion.create({
    taskRate: taskRateId,
    orderId,
    workersPresent,
    quantityCompleted,
    totalPayment,
    paymentPerWorker,
    taskDescription,
    taskDate: req.body.taskDate || new Date()
  });

  // Populate the created task completion
  await taskCompletion.populate([
    { path: 'taskRate', select: 'taskName taskType ratePerUnit unit' },
    { path: 'orderId', select: 'orderNumber clientName' },
    { path: 'workersPresent.worker', select: 'name phone' }
  ]);

  res.status(201).json({
    success: true,
    data: taskCompletion
  });
});

// @desc    Update task completion
// @route   PUT /api/task-completions/:id
// @access  Private
const updateTaskCompletion = asyncHandler(async (req, res) => {
  let taskCompletion = await TaskCompletion.findById(req.params.id);

  if (!taskCompletion) {
    res.status(404);
    throw new Error('Task completion not found');
  }

  // If quantity or workers changed, recalculate payment
  if (req.body.quantityCompleted || req.body.workersPresent) {
    const taskRate = await TaskRate.findById(taskCompletion.taskRate);
    const quantity = req.body.quantityCompleted || taskCompletion.quantityCompleted;
    const workers = req.body.workersPresent || taskCompletion.workersPresent;
    
    req.body.totalPayment = quantity * taskRate.ratePerUnit;
    req.body.paymentPerWorker = workers.length > 0 ? req.body.totalPayment / workers.length : 0;
  }

  taskCompletion = await TaskCompletion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'taskRate', select: 'taskName taskType ratePerUnit unit' },
    { path: 'orderId', select: 'orderNumber clientName' },
    { path: 'workersPresent.worker', select: 'name phone' }
  ]);

  res.json({
    success: true,
    data: taskCompletion
  });
});

// @desc    Verify task completion
// @route   PUT /api/task-completions/:id/verify
// @access  Private
const verifyTaskCompletion = asyncHandler(async (req, res) => {
  const taskCompletion = await TaskCompletion.findByIdAndUpdate(
    req.params.id,
    {
      status: 'verified',
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      notes: req.body.notes
    },
    { new: true, runValidators: true }
  ).populate([
    { path: 'taskRate', select: 'taskName taskType ratePerUnit unit' },
    { path: 'orderId', select: 'orderNumber clientName' },
    { path: 'workersPresent.worker', select: 'name phone' },
    { path: 'verifiedBy', select: 'name email' }
  ]);

  if (!taskCompletion) {
    res.status(404);
    throw new Error('Task completion not found');
  }

  res.json({
    success: true,
    data: taskCompletion
  });
});

// @desc    Get worker task summary
// @route   GET /api/task-completions/worker/:workerId/summary
// @access  Private
const getWorkerTaskSummary = asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.taskDate = {};
    if (startDate) dateFilter.taskDate.$gte = new Date(startDate);
    if (endDate) dateFilter.taskDate.$lte = new Date(endDate);
  }

  const taskCompletions = await TaskCompletion.find({
    'workersPresent.worker': workerId,
    ...dateFilter
  }).populate('taskRate', 'taskName taskType ratePerUnit unit');

  // Calculate summary
  const summary = {
    totalTasks: taskCompletions.length,
    totalEarnings: 0,
    taskBreakdown: {}
  };

  taskCompletions.forEach(completion => {
    const taskType = completion.taskRate.taskType;
    const earnings = completion.paymentPerWorker;
    
    summary.totalEarnings += earnings;
    
    if (!summary.taskBreakdown[taskType]) {
      summary.taskBreakdown[taskType] = {
        count: 0,
        earnings: 0,
        tasks: []
      };
    }
    
    summary.taskBreakdown[taskType].count++;
    summary.taskBreakdown[taskType].earnings += earnings;
    summary.taskBreakdown[taskType].tasks.push({
      taskName: completion.taskRate.taskName,
      date: completion.taskDate,
      quantity: completion.quantityCompleted,
      earnings
    });
  });

  res.json({
    success: true,
    data: summary
  });
});

module.exports = {
  getTaskCompletions,
  getTaskCompletion,
  recordTaskCompletion,
  updateTaskCompletion,
  verifyTaskCompletion,
  getWorkerTaskSummary
};
