const asyncHandler = require('../middleware/asyncHandler');
const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

// @desc    Get all product categories
// @route   GET /api/inventory/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await ProductCategory.find({});
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Add new product category
// @route   POST /api/inventory/categories
// @access  Private
const addCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.create(req.body);
  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update product category
// @route   PUT /api/inventory/categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  let category = await ProductCategory.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  category = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.json({
    success: true,
    data: category
  });
});

// @desc    Get all products
// @route   GET /api/inventory/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { category, condition, search } = req.query;
  
  let query = {};
  
  if (category) {
    query.category = category;
  }
  
  if (condition) {
    query.condition = condition;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } }
    ];
  }

  const products = await Product.find(query).populate('category', 'name');
  
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/inventory/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  res.json({
    success: true,
    data: product
  });
});

// @desc    Add new product
// @route   POST /api/inventory/products
// @access  Private
const addProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  const populatedProduct = await Product.findById(product._id).populate('category', 'name');
  
  res.status(201).json({
    success: true,
    data: populatedProduct
  });
});

// @desc    Update product
// @route   PUT /api/inventory/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('category', 'name');
  
  res.json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/inventory/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  await product.deleteOne();
  
  res.json({
    success: true,
    data: {}
  });
});

// @desc    Get available products
// @route   GET /api/inventory/products/available
// @access  Public
const getAvailableProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $gt: ['$quantityInStock', '$quantityRented'] }
  }).populate('category', 'name');
  
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAvailableProducts
}; 