const asyncHandler = require("../middleware/asyncHandler");
const WorkerTask = require("../models/WorkerTask");
const Order = require("../models/Order");
const Worker = require("../models/Worker");

// @desc    Get all worker tasks
// @route   GET /api/worker-tasks
// @access  Private
const getWorkerTasks = asyncHandler(async (req, res) => {
  const { taskType, orderId, workerId, startDate, endDate } = req.query;

  let query = {};

  if (taskType) {
    query.taskType = taskType;
  }

  if (orderId) {
    query.order = orderId;
  }

  if (workerId) {
    query["workers.worker"] = workerId;
  }

  if (startDate && endDate) {
    query.completedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const workerTasks = await WorkerTask.find(query)
    .populate("order", "client orderDate status")
    .populate("workers.worker", "name phone position")
    .populate("createdBy", "name")
    .populate({
      path: "order",
      populate: { path: "client", select: "name contactPerson" },
    })
    .sort({ completedAt: -1 });

  res.json({
    success: true,
    count: workerTasks.length,
    data: workerTasks,
  });
});

// @desc    Get single worker task
// @route   GET /api/worker-tasks/:id
// @access  Private
const getWorkerTask = asyncHandler(async (req, res) => {
  const workerTask = await WorkerTask.findById(req.params.id)
    .populate("order", "client orderDate status")
    .populate("workers.worker", "name phone position")
    .populate("createdBy", "name")
    .populate({
      path: "order",
      populate: { path: "client", select: "name contactPerson" },
    });

  if (!workerTask) {
    res.status(404);
    throw new Error("Worker task not found");
  }

  res.json({
    success: true,
    data: workerTask,
  });
});

// @desc    Create new worker task
// @route   POST /api/worker-tasks
// @access  Private
const createWorkerTask = asyncHandler(async (req, res) => {
  const { orderId, order, taskType, workers, taskAmount, notes, completedAt } =
    req.body;
  const resolvedOrderId = orderId || order;

  // Validate required fields
  if (!resolvedOrderId) {
    res.status(400);
    throw new Error("Order is required");
  }

  if (!taskType) {
    res.status(400);
    throw new Error("Task type is required");
  }

  if (!workers || workers.length === 0) {
    res.status(400);
    throw new Error("At least one worker is required");
  }

  if (!taskAmount && taskAmount !== 0) {
    res.status(400);
    throw new Error("Task amount is required");
  }

  // Verify order exists
  const foundOrder = await Order.findById(resolvedOrderId);
  if (!foundOrder) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Verify workers exist
  for (const workerData of workers) {
    const worker = await Worker.findById(workerData.worker);
    if (!worker) {
      res.status(404);
      throw new Error(`Worker ${workerData.worker} not found`);
    }
  }

  // Create worker task
  const workerTask = await WorkerTask.create({
    order: resolvedOrderId,
    taskType,
    workers,
    taskAmount,
    notes,
    ...(completedAt ? { completedAt } : {}),
    createdBy: req.user._id,
  });

  const populatedWorkerTask = await WorkerTask.findById(workerTask._id)
    .populate("order", "client orderDate status")
    .populate("workers.worker", "name phone position")
    .populate("createdBy", "name")
    .populate({
      path: "order",
      populate: { path: "client", select: "name contactPerson" },
    });

  res.status(201).json({
    success: true,
    data: populatedWorkerTask,
  });
});

// @desc    Update worker task
// @route   PUT /api/worker-tasks/:id
// @access  Private
const updateWorkerTask = asyncHandler(async (req, res) => {
  let workerTask = await WorkerTask.findById(req.params.id);

  if (!workerTask) {
    res.status(404);
    throw new Error("Worker task not found");
  }

  // If updating workers, verify they exist
  if (req.body.workers) {
    for (const workerData of req.body.workers) {
      const worker = await Worker.findById(workerData.worker);
      if (!worker) {
        res.status(404);
        throw new Error(`Worker ${workerData.worker} not found`);
      }
    }
  }

  workerTask = await WorkerTask.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("order", "client orderDate status")
    .populate("workers.worker", "name phone position")
    .populate("createdBy", "name")
    .populate({
      path: "order",
      populate: { path: "client", select: "name contactPerson" },
    });

  res.json({
    success: true,
    data: workerTask,
  });
});

// @desc    Delete worker task
// @route   DELETE /api/worker-tasks/:id
// @access  Private
const deleteWorkerTask = asyncHandler(async (req, res) => {
  const workerTask = await WorkerTask.findById(req.params.id);

  if (!workerTask) {
    res.status(404);
    throw new Error("Worker task not found");
  }

  await workerTask.remove();

  res.json({
    success: true,
    data: {},
  });
});

// @desc    Get worker earnings report
// @route   GET /api/worker-tasks/earnings
// @access  Private
const getWorkerEarnings = asyncHandler(async (req, res) => {
  const { workerId, startDate, endDate } = req.query;

  if (!workerId) {
    res.status(400);
    throw new Error("Worker ID is required");
  }

  let dateQuery = {};

  if (startDate && endDate) {
    dateQuery.completedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Find all tasks where this worker was present
  const workerTasks = await WorkerTask.find({
    "workers.worker": workerId,
    "workers.present": true,
    ...dateQuery,
  })
    .populate("order", "client orderDate status")
    .populate("workers.worker", "name")
    .sort({ completedAt: -1 });

  // Calculate earnings for each task
  const tasksWithEarnings = workerTasks.map((task) => {
    const presentWorkers = task.workers.filter((w) => w.present).length;
    // Each worker gets the full task amount (their daily rate)
    // No division - each worker is paid their full daily rate per order per day
    const shareAmount = task.taskAmount;

    return {
      _id: task._id,
      order: task.order,
      taskType: task.taskType,
      completedAt: task.completedAt,
      totalAmount: task.taskAmount,
      presentWorkers,
      shareAmount,
    };
  });

  // Calculate total earnings
  const totalEarnings = tasksWithEarnings.reduce(
    (total, task) => total + task.shareAmount,
    0
  );

  res.json({
    success: true,
    data: {
      worker: await Worker.findById(workerId, "name phone position"),
      tasks: tasksWithEarnings,
      totalEarnings,
      period: {
        startDate: startDate || "All time",
        endDate: endDate || "All time",
      },
    },
  });
});

module.exports = {
  getWorkerTasks,
  getWorkerTask,
  createWorkerTask,
  updateWorkerTask,
  deleteWorkerTask,
  getWorkerEarnings,
};
