const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Violation = require('../models/Violation');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, client } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (client) {
    query.client = client;
  }
  
  if (startDate && endDate) {
    query.orderDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const orders = await Order.find(query)
    .populate('client', 'name contactPerson phone email')
    .populate('discountApprovedBy', 'name')
    .sort({ orderDate: -1 });
  
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'name contactPerson phone email address')
    .populate('discountApprovedBy', 'name');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const orderItems = await OrderItem.find({ order: req.params.id })
    .populate('product', 'name type rentalPrice');
  
  const violations = await Violation.find({ order: req.params.id });
  
  res.json({
    success: true,
    data: {
      order,
      items: orderItems,
      violations
    }
  });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  console.log('Creating order with data:', req.body);
  
  const { client, rentalStartDate, rentalEndDate, items, notes } = req.body;
  
  // Validate required fields
  if (!client) {
    res.status(400);
    throw new Error('Client is required');
  }
  
  if (!rentalStartDate) {
    res.status(400);
    throw new Error('Rental start date is required');
  }
  
  if (!rentalEndDate) {
    res.status(400);
    throw new Error('Rental end date is required');
  }
  
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('At least one item is required');
  }
  
  // Validate dates
  const startDate = new Date(rentalStartDate);
  const endDate = new Date(rentalEndDate);
  
  if (isNaN(startDate.getTime())) {
    res.status(400);
    throw new Error('Invalid rental start date');
  }
  
  if (isNaN(endDate.getTime())) {
    res.status(400);
    throw new Error('Invalid rental end date');
  }
  
  if (startDate >= endDate) {
    res.status(400);
    throw new Error('Rental end date must be after start date');
  }
  
  // Calculate expected return date (3 days after rental end)
  const expectedReturnDate = new Date(endDate);
  expectedReturnDate.setDate(expectedReturnDate.getDate() + 3);
  
  // Calculate total amount
  let totalAmount = 0;
  for (const item of items) {
    const productId = item.productId || item.product;
    const quantity = item.quantity || item.quantityRented || 1;
    
    const product = await Product.findById(productId);
    if (!product) {
      res.status(400);
      throw new Error(`Product ${productId} not found`);
    }
    totalAmount += product.rentalPrice * quantity;
  }
  
  // Create order
  const order = await Order.create({
    client,
    rentalStartDate,
    rentalEndDate,
    expectedReturnDate,
    totalAmount,
    notes
  });
  
  // Create order items and update product quantities
  for (const item of items) {
    const productId = item.productId || item.product;
    const quantity = item.quantity || item.quantityRented || 1;
    
    const product = await Product.findById(productId);
    
    await OrderItem.create({
      order: order._id,
      product: productId,
      quantityRented: quantity,
      unitPriceAtTimeOfRental: product.rentalPrice
    });
    
    // Update product rented quantity
    product.quantityRented += quantity;
    await product.save();
  }
  
  const populatedOrder = await Order.findById(order._id)
    .populate('client', 'name contactPerson phone email')
    .populate('discountApprovedBy', 'name');
  
  res.status(201).json({
    success: true,
    data: populatedOrder
  });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('client', 'name contactPerson phone email')
    .populate('discountApprovedBy', 'name');
  
  res.json({
    success: true,
    data: order
  });
});

// @desc    Mark order as returned
// @route   PUT /api/orders/:id/return
// @access  Private
const markOrderReturned = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const actualReturnDate = new Date();
  order.actualReturnDate = actualReturnDate;
  order.status = 'Completed';
  
  // Update product quantities
  const orderItems = await OrderItem.find({ order: req.params.id });
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    product.quantityRented -= item.quantityRented;
    await product.save();
  }
  
  // Check for violations
  const violations = [];
  if (actualReturnDate > order.expectedReturnDate) {
    const overdueDays = Math.ceil((actualReturnDate - order.expectedReturnDate) / (1000 * 60 * 60 * 24));
    const penaltyAmount = overdueDays * 50; // $50 per day penalty
    
    const violation = await Violation.create({
      order: order._id,
      violationType: 'Overdue Return',
      description: `Returned ${overdueDays} days late`,
      penaltyAmount
    });
    violations.push(violation);
  }
  
  await order.save();
  
  res.json({
    success: true,
    data: {
      order,
      violations
    }
  });
});

// @desc    Request discount
// @route   POST /api/orders/:id/discount/request
// @access  Private
const requestDiscount = asyncHandler(async (req, res) => {
  const { discountAmount, reason } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  if (discountAmount > order.totalAmount) {
    res.status(400);
    throw new Error('Discount amount cannot exceed total amount');
  }
  
  order.discountAmount = discountAmount;
  order.notes = order.notes ? `${order.notes}\nDiscount Request: ${reason}` : `Discount Request: ${reason}`;
  await order.save();
  
  res.json({
    success: true,
    data: order
  });
});

// @desc    Approve/reject discount
// @route   PUT /api/orders/:id/discount/approve
// @access  Private (Admin only)
const approveDiscount = asyncHandler(async (req, res) => {
  const { approved } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  if (approved) {
    order.discountApplied = true;
    order.discountApprovedBy = req.user._id;
    order.totalAmount -= order.discountAmount;
  } else {
    order.discountAmount = 0;
    order.discountApplied = false;
  }
  
  await order.save();
  
  const populatedOrder = await Order.findById(order._id)
    .populate('client', 'name contactPerson phone email')
    .populate('discountApprovedBy', 'name');
  
  res.json({
    success: true,
    data: populatedOrder
  });
});

// @desc    Update payment
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePayment = asyncHandler(async (req, res) => {
  const { amountPaid } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  order.amountPaid = amountPaid;
  
  if (amountPaid >= order.totalAmount) {
    order.paymentStatus = 'Paid';
  } else if (amountPaid > 0) {
    order.paymentStatus = 'Partially Paid';
  } else {
    order.paymentStatus = 'Pending';
  }
  
  await order.save();
  
  const populatedOrder = await Order.findById(order._id)
    .populate('client', 'name contactPerson phone email')
    .populate('discountApprovedBy', 'name');
  
  res.json({
    success: true,
    data: populatedOrder
  });
});

// @desc    Get all violations
// @route   GET /api/orders/violations
// @access  Private
const getViolations = asyncHandler(async (req, res) => {
  const violations = await Violation.find({})
    .populate('order', 'client orderDate')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name' }
    });
  
  res.json({
    success: true,
    count: violations.length,
    data: violations
  });
});

// @desc    Get single violation
// @route   GET /api/orders/violations/:id
// @access  Private
const getViolation = asyncHandler(async (req, res) => {
  const violation = await Violation.findById(req.params.id)
    .populate('order', 'client orderDate expectedReturnDate actualReturnDate totalAmount status items')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { 
        path: 'client', 
        select: 'name email phone address' 
      }
    })
    .populate({
      path: 'order',
      populate: { 
        path: 'items',
        populate: { path: 'product', select: 'name' }
      }
    });
  
  if (!violation) {
    res.status(404);
    throw new Error('Violation not found');
  }
  
  res.json({
    success: true,
    data: violation
  });
});

// @desc    Create new violation
// @route   POST /api/orders/violations
// @access  Private
const createViolation = asyncHandler(async (req, res) => {
  const { orderId, violationType, description, penaltyAmount, dueDate, priority, notes, clientId } = req.body;
  
  // Verify order exists
  const order = await Order.findById(orderId).populate('client');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const violation = await Violation.create({
    order: orderId,
    violationType,
    description,
    penaltyAmount,
    dueDate,
    priority: priority || 'medium',
    notes,
    createdBy: req.user._id
  });
  
  const populatedViolation = await Violation.findById(violation._id)
    .populate('order', 'client orderDate expectedReturnDate totalAmount')
    .populate('createdBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name email phone' }
    });
  
  res.status(201).json({
    success: true,
    data: populatedViolation
  });
});

// @desc    Update violation
// @route   PUT /api/orders/violations/:id
// @access  Private
const updateViolation = asyncHandler(async (req, res) => {
  const violation = await Violation.findById(req.params.id);
  
  if (!violation) {
    res.status(404);
    throw new Error('Violation not found');
  }
  
  // Don't allow updating resolved violations
  if (violation.resolved) {
    res.status(400);
    throw new Error('Cannot update resolved violation');
  }
  
  const updatedViolation = await Violation.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
    .populate('order', 'client orderDate expectedReturnDate totalAmount')
    .populate('updatedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name email phone' }
    });
  
  res.json({
    success: true,
    data: updatedViolation
  });
});

// @desc    Resolve violation
// @route   PUT /api/orders/violations/:id/resolve
// @access  Private
const resolveViolation = asyncHandler(async (req, res) => {
  const violation = await Violation.findById(req.params.id);
  
  if (!violation) {
    res.status(404);
    throw new Error('Violation not found');
  }
  
  const { 
    paidAmount, 
    waivedAmount, 
    resolutionNotes, 
    paymentMethod, 
    receiptNumber 
  } = req.body;
  
  violation.resolved = true;
  violation.resolvedDate = new Date();
  violation.resolvedBy = req.user._id;
  violation.paidAmount = paidAmount || 0;
  violation.waivedAmount = waivedAmount || 0;
  violation.resolutionNotes = resolutionNotes;
  violation.paymentMethod = paymentMethod;
  violation.receiptNumber = receiptNumber;
  
  await violation.save();
  
  const populatedViolation = await Violation.findById(violation._id)
    .populate('order', 'client orderDate expectedReturnDate totalAmount')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name email phone' }
    });
  
  res.json({
    success: true,
    data: populatedViolation
  });
});

// @desc    Bulk resolve violations
// @route   PUT /api/orders/violations/bulk-resolve
// @access  Private
const bulkResolveViolations = asyncHandler(async (req, res) => {
  const { violationIds, resolutionNotes } = req.body;
  
  if (!violationIds || !Array.isArray(violationIds) || violationIds.length === 0) {
    res.status(400);
    throw new Error('Violation IDs are required');
  }
  
  const violations = await Violation.find({ _id: { $in: violationIds }, resolved: false });
  
  if (violations.length === 0) {
    res.status(404);
    throw new Error('No unresolved violations found');
  }
  
  // Update all violations
  await Violation.updateMany(
    { _id: { $in: violationIds }, resolved: false },
    {
      resolved: true,
      resolvedDate: new Date(),
      resolvedBy: req.user._id,
      resolutionNotes: resolutionNotes || 'Bulk resolution'
    }
  );
  
  const updatedViolations = await Violation.find({ _id: { $in: violationIds } })
    .populate('order', 'client orderDate')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name email phone' }
    });
  
  res.json({
    success: true,
    count: updatedViolations.length,
    data: updatedViolations
  });
});

// @desc    Delete violation
// @route   DELETE /api/orders/violations/:id
// @access  Private
const deleteViolation = asyncHandler(async (req, res) => {
  const violation = await Violation.findById(req.params.id);
  
  if (!violation) {
    res.status(404);
    throw new Error('Violation not found');
  }
  
  // Don't allow deleting resolved violations
  if (violation.resolved) {
    res.status(400);
    throw new Error('Cannot delete resolved violation');
  }
  
  await violation.deleteOne();
  
  res.json({
    success: true,
    message: 'Violation deleted successfully'
  });
});

// @desc    Export violations
// @route   GET /api/orders/violations/export
// @access  Private
const exportViolations = asyncHandler(async (req, res) => {
  const violations = await Violation.find({})
    .populate('order', 'client orderDate expectedReturnDate totalAmount')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name email phone' }
    });
  
  // Create CSV content
  const csvHeader = 'Order ID,Client Name,Violation Type,Description,Penalty Amount,Status,Created Date,Resolved Date,Resolved By\n';
  const csvRows = violations.map(violation => {
    const order = violation.order;
    const client = order?.client;
    
    return [
      order?._id?.toString().slice(-8) || 'N/A',
      client?.name || 'Unknown',
      violation.violationType || '',
      `"${violation.description?.replace(/"/g, '""') || ''}"`,
      violation.penaltyAmount || 0,
      violation.resolved ? 'Resolved' : 'Pending',
      new Date(violation.createdAt).toLocaleDateString(),
      violation.resolvedDate ? new Date(violation.resolvedDate).toLocaleDateString() : '',
      violation.resolvedBy?.name || ''
    ].join(',');
  }).join('\n');
  
  const csvContent = csvHeader + csvRows;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=violations-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  markOrderReturned,
  requestDiscount,
  approveDiscount,
  updatePayment,
  getViolations,
  getViolation,
  createViolation,
  updateViolation,
  resolveViolation,
  bulkResolveViolations,
  deleteViolation,
  exportViolations
}; 