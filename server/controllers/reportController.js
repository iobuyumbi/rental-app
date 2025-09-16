const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Violation = require('../models/Violation');
const CasualWorker = require('../models/Worker');
const CasualAttendance = require('../models/WorkersAttendance');

// @desc    Generate invoice data for an order
// @route   GET /api/reports/invoices/:orderId
// @access  Private
const generateInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('client', 'name contactPerson phone email address')
    .populate('discountApprovedBy', 'name');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const orderItems = await OrderItem.find({ order: req.params.orderId })
    .populate('product', 'name type rentalPrice');
  
  const invoiceData = {
    invoiceNumber: `INV-${order._id.toString().slice(-6).toUpperCase()}`,
    orderDate: order.orderDate,
    dueDate: order.expectedReturnDate,
    client: order.client,
    items: orderItems.map(item => ({
      name: item.product.name,
      type: item.product.type,
      quantity: item.quantityRented,
      unitPrice: item.unitPriceAtTimeOfRental,
      totalPrice: item.totalPrice
    })),
    subtotal: order.totalAmount + (order.discountAmount || 0),
    discountAmount: order.discountAmount || 0,
    discountApprovedBy: order.discountApprovedBy,
    totalAmount: order.totalAmount,
    amountPaid: order.amountPaid,
    remainingAmount: order.remainingAmount,
    paymentStatus: order.paymentStatus,
    notes: order.notes
  };
  
  res.json({
    success: true,
    data: invoiceData
  });
});

// @desc    Generate receipt data for an order
// @route   GET /api/reports/receipts/:orderId
// @access  Private
const generateReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('client', 'name contactPerson phone email address');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const orderItems = await OrderItem.find({ order: req.params.orderId })
    .populate('product', 'name type');
  
  const receiptData = {
    receiptNumber: `RCP-${order._id.toString().slice(-6).toUpperCase()}`,
    orderDate: order.orderDate,
    returnDate: order.actualReturnDate || 'Not returned yet',
    client: order.client,
    items: orderItems.map(item => ({
      name: item.product.name,
      type: item.product.type,
      quantity: item.quantityRented,
      unitPrice: item.unitPriceAtTimeOfRental,
      totalPrice: item.totalPrice
    })),
    totalAmount: order.totalAmount,
    amountPaid: order.amountPaid,
    paymentStatus: order.paymentStatus,
    paymentDate: new Date()
  };
  
  res.json({
    success: true,
    data: receiptData
  });
});

// @desc    Get discount approvals log
// @route   GET /api/reports/discount-approvals
// @access  Private
const getDiscountApprovals = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = {
    discountApplied: true
  };
  
  if (startDate && endDate) {
    query.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const orders = await Order.find(query)
    .populate('client', 'name')
    .populate('discountApprovedBy', 'name')
    .sort({ updatedAt: -1 });
  
  const discountLog = orders.map(order => ({
    orderId: order._id,
    orderDate: order.orderDate,
    client: order.client.name,
    originalAmount: order.totalAmount + order.discountAmount,
    discountAmount: order.discountAmount,
    finalAmount: order.totalAmount,
    approvedBy: order.discountApprovedBy?.name || 'Unknown',
    approvalDate: order.updatedAt
  }));
  
  res.json({
    success: true,
    count: discountLog.length,
    data: discountLog
  });
});

// @desc    Get worker remuneration summary
// @route   GET /api/reports/worker-remuneration-summary
// @access  Private
const getWorkerRemunerationSummary = asyncHandler(async (req, res) => {
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

// @desc    Get inventory status report
// @route   GET /api/reports/inventory-status
// @access  Private
const getInventoryStatus = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate('category', 'name');
  
  const inventoryStatus = {
    totalProducts: products.length,
    totalValue: 0,
    totalRented: 0,
    totalAvailable: 0,
    totalUnderRepair: 0,
    categories: {},
    conditionBreakdown: {
      Good: 0,
      Fair: 0,
      'Needs Repair': 0
    }
  };
  
  for (const product of products) {
    const productValue = product.purchasePrice * product.quantityInStock;
    inventoryStatus.totalValue += productValue;
    inventoryStatus.totalRented += product.quantityRented;
    inventoryStatus.totalAvailable += product.availableQuantity;
    inventoryStatus.conditionBreakdown[product.condition]++;
    
    // Category breakdown
    const categoryName = product.category.name;
    if (!inventoryStatus.categories[categoryName]) {
      inventoryStatus.categories[categoryName] = {
        count: 0,
        totalValue: 0,
        totalRented: 0,
        totalAvailable: 0
      };
    }
    
    inventoryStatus.categories[categoryName].count++;
    inventoryStatus.categories[categoryName].totalValue += productValue;
    inventoryStatus.categories[categoryName].totalRented += product.quantityRented;
    inventoryStatus.categories[categoryName].totalAvailable += product.availableQuantity;
  }
  
  // Count products under repair
  const productsUnderRepair = products.filter(p => p.condition === 'Needs Repair');
  inventoryStatus.totalUnderRepair = productsUnderRepair.length;
  
  res.json({
    success: true,
    data: inventoryStatus
  });
});

// @desc    Get overdue returns report
// @route   GET /api/reports/overdue-returns
// @access  Private
const getOverdueReturns = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  
  const overdueOrders = await Order.find({
    status: { $in: ['Pending', 'Confirmed'] },
    expectedReturnDate: { $lt: currentDate }
  })
    .populate('client', 'name contactPerson phone email')
    .sort({ expectedReturnDate: 1 });
  
  const overdueData = overdueOrders.map(order => {
    const overdueDays = Math.ceil((currentDate - order.expectedReturnDate) / (1000 * 60 * 60 * 24));
    const estimatedPenalty = overdueDays * 50; // $50 per day
    
    return {
      orderId: order._id,
      orderDate: order.orderDate,
      expectedReturnDate: order.expectedReturnDate,
      overdueDays,
      client: order.client,
      totalAmount: order.totalAmount,
      amountPaid: order.amountPaid,
      estimatedPenalty
    };
  });
  
  res.json({
    success: true,
    count: overdueData.length,
    data: overdueData
  });
});

module.exports = {
  generateInvoice,
  generateReceipt,
  getDiscountApprovals,
  getWorkerRemunerationSummary,
  getInventoryStatus,
  getOverdueReturns
}; 