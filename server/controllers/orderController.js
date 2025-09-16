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
  const { client, rentalStartDate, rentalEndDate, items, notes } = req.body;
  
  // Calculate expected return date (3 days after rental end)
  const expectedReturnDate = new Date(rentalEndDate);
  expectedReturnDate.setDate(expectedReturnDate.getDate() + 3);
  
  // Calculate total amount
  let totalAmount = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Product ${item.product} not found`);
    }
    totalAmount += product.rentalPrice * item.quantityRented;
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
    const product = await Product.findById(item.product);
    
    await OrderItem.create({
      order: order._id,
      product: item.product,
      quantityRented: item.quantityRented,
      unitPriceAtTimeOfRental: product.rentalPrice
    });
    
    // Update product rented quantity
    product.quantityRented += item.quantityRented;
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

// @desc    Resolve violation
// @route   PUT /api/orders/violations/:id/resolve
// @access  Private
const resolveViolation = asyncHandler(async (req, res) => {
  const violation = await Violation.findById(req.params.id);
  
  if (!violation) {
    res.status(404);
    throw new Error('Violation not found');
  }
  
  violation.resolved = true;
  violation.resolvedDate = new Date();
  violation.resolvedBy = req.user._id;
  
  await violation.save();
  
  const populatedViolation = await Violation.findById(violation._id)
    .populate('order', 'client orderDate')
    .populate('resolvedBy', 'name')
    .populate({
      path: 'order',
      populate: { path: 'client', select: 'name' }
    });
  
  res.json({
    success: true,
    data: populatedViolation
  });
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
  resolveViolation
}; 