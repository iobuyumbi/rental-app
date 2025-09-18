const express = require('express');
const {
  getCategories,
  addCategory,
  updateCategory,
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAvailableProducts
} = require('../controllers/inventoryController');
const { protect, adminOrAssistant } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/available', getAvailableProducts);
router.get('/products/:id', getProduct);

// Protected routes
router.use(protect);
router.use(adminOrAssistant);

router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router; 