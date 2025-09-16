const asyncHandler = require('../middleware/asyncHandler');
const TaskRate = require('../models/TaskRate');

// @desc    Get all task rates
// @route   GET /api/task-rates
// @access  Private
const getTaskRates = asyncHandler(async (req, res) => {
  const { taskType, active } = req.query;
  
  let filter = {};
  if (taskType) filter.taskType = taskType;
  if (active !== undefined) filter.active = active === 'true';

  const taskRates = await TaskRate.find(filter)
    .populate('createdBy', 'name email')
    .sort({ taskType: 1, taskName: 1 });

  res.json({
    success: true,
    count: taskRates.length,
    data: taskRates
  });
});

// @desc    Get single task rate
// @route   GET /api/task-rates/:id
// @access  Private
const getTaskRate = asyncHandler(async (req, res) => {
  const taskRate = await TaskRate.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!taskRate) {
    res.status(404);
    throw new Error('Task rate not found');
  }

  res.json({
    success: true,
    data: taskRate
  });
});

// @desc    Create new task rate
// @route   POST /api/task-rates
// @access  Private
const createTaskRate = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const taskRate = await TaskRate.create(req.body);

  res.status(201).json({
    success: true,
    data: taskRate
  });
});

// @desc    Update task rate
// @route   PUT /api/task-rates/:id
// @access  Private
const updateTaskRate = asyncHandler(async (req, res) => {
  let taskRate = await TaskRate.findById(req.params.id);

  if (!taskRate) {
    res.status(404);
    throw new Error('Task rate not found');
  }

  taskRate = await TaskRate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: taskRate
  });
});

// @desc    Delete task rate (soft delete - set active to false)
// @route   DELETE /api/task-rates/:id
// @access  Private
const deleteTaskRate = asyncHandler(async (req, res) => {
  const taskRate = await TaskRate.findById(req.params.id);

  if (!taskRate) {
    res.status(404);
    throw new Error('Task rate not found');
  }

  await TaskRate.findByIdAndUpdate(req.params.id, { active: false });

  res.json({
    success: true,
    message: 'Task rate deactivated successfully'
  });
});

// @desc    Get task rates by type
// @route   GET /api/task-rates/by-type/:taskType
// @access  Private
const getTaskRatesByType = asyncHandler(async (req, res) => {
  const taskRates = await TaskRate.find({
    taskType: req.params.taskType,
    active: true
  }).sort({ taskName: 1 });

  res.json({
    success: true,
    count: taskRates.length,
    data: taskRates
  });
});

module.exports = {
  getTaskRates,
  getTaskRate,
  createTaskRate,
  updateTaskRate,
  deleteTaskRate,
  getTaskRatesByType
};
