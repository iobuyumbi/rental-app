const asyncHandler = require('../middleware/asyncHandler');
const Purchase = require('../models/Purchase');
const Repair = require('../models/Repair');
const Product = require('../models/Product');

// @desc    Record a new purchase
// @route   POST /api/transactions/purchases
// @access  Private
const recordPurchase = asyncHandler(async (req, res) => {
  const { product, quantity, unitCost, supplier, notes } = req.body;
  
  const totalCost = quantity * unitCost;
  
  const purchase = await Purchase.create({
    product,
    quantity,
    unitCost,
    totalCost,
    supplier,
    notes
  });
  
  // Update product stock
  const productDoc = await Product.findById(product);
  if (productDoc) {
    productDoc.quantityInStock += quantity;
    await productDoc.save();
  }
  
  const populatedPurchase = await Purchase.findById(purchase._id)
    .populate('product', 'name type category');
  
  res.status(201).json({
    success: true,
    data: populatedPurchase
  });
});

// @desc    Get all purchases
// @route   GET /api/transactions/purchases
// @access  Private
const getPurchases = asyncHandler(async (req, res) => {
  const { startDate, endDate, supplier, product } = req.query;
  
  let query = {};
  
  if (supplier) {
    query.supplier = { $regex: supplier, $options: 'i' };
  }
  
  if (product) {
    query.product = product;
  }
  
  if (startDate && endDate) {
    query.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const purchases = await Purchase.find(query)
    .populate('product', 'name type category')
    .sort({ purchaseDate: -1 });
  
  res.json({
    success: true,
    count: purchases.length,
    data: purchases
  });
});

// @desc    Record a new repair
// @route   POST /api/transactions/repairs
// @access  Private
const recordRepair = asyncHandler(async (req, res) => {
  const { product, cost, description, repairedBy, notes } = req.body;
  
  const repair = await Repair.create({
    product,
    cost,
    description,
    repairedBy,
    notes
  });
  
  // Update product condition to 'Good' when repair is completed
  const productDoc = await Product.findById(product);
  if (productDoc && productDoc.condition === 'Needs Repair') {
    productDoc.condition = 'Good';
    await productDoc.save();
  }
  
  const populatedRepair = await Repair.findById(repair._id)
    .populate('product', 'name type category condition');
  
  res.status(201).json({
    success: true,
    data: populatedRepair
  });
});

// @desc    Get all repairs
// @route   GET /api/transactions/repairs
// @access  Private
const getRepairs = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, product } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (product) {
    query.product = product;
  }
  
  if (startDate && endDate) {
    query.repairDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const repairs = await Repair.find(query)
    .populate('product', 'name type category condition')
    .sort({ repairDate: -1 });
  
  res.json({
    success: true,
    count: repairs.length,
    data: repairs
  });
});

// @desc    Update repair status
// @route   PUT /api/transactions/repairs/:id
// @access  Private
const updateRepair = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  let repair = await Repair.findById(req.params.id);
  
  if (!repair) {
    res.status(404);
    throw new Error('Repair not found');
  }
  
  repair.status = status || repair.status;
  repair.notes = notes || repair.notes;
  
  if (status === 'Completed' && !repair.completedDate) {
    repair.completedDate = new Date();
  }
  
  await repair.save();
  
  // Update product condition when repair is completed
  if (status === 'Completed') {
    const product = await Product.findById(repair.product);
    if (product && product.condition === 'Needs Repair') {
      product.condition = 'Good';
      await product.save();
    }
  }
  
  const populatedRepair = await Repair.findById(repair._id)
    .populate('product', 'name type category condition');
  
  res.json({
    success: true,
    data: populatedRepair
  });
});

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
const getTransactionSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }
  
  const dateFilter = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
  
  // Get purchases summary
  const purchases = await Purchase.find({
    purchaseDate: dateFilter
  });
  
  const totalPurchaseCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalPurchaseQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  
  // Get repairs summary
  const repairs = await Repair.find({
    repairDate: dateFilter
  });
  
  const totalRepairCost = repairs.reduce((sum, repair) => sum + repair.cost, 0);
  const completedRepairs = repairs.filter(repair => repair.status === 'Completed').length;
  const pendingRepairs = repairs.filter(repair => repair.status === 'Pending').length;
  
  res.json({
    success: true,
    data: {
      period: {
        startDate,
        endDate
      },
      purchases: {
        count: purchases.length,
        totalCost: totalPurchaseCost,
        totalQuantity: totalPurchaseQuantity
      },
      repairs: {
        count: repairs.length,
        totalCost: totalRepairCost,
        completed: completedRepairs,
        pending: pendingRepairs
      },
      summary: {
        totalExpenses: totalPurchaseCost + totalRepairCost
      }
    }
  });
});

module.exports = {
  recordPurchase,
  getPurchases,
  recordRepair,
  getRepairs,
  updateRepair,
  getTransactionSummary
}; 