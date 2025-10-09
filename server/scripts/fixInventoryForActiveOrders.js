const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/rental-app');

async function fixInventoryForActiveOrders() {
  try {
    console.log('🔧 Fixing inventory for active orders...\n');

    // Get all active orders (in_progress or confirmed)
    const activeOrders = await Order.find({ 
      status: { $in: ['in_progress', 'confirmed'] } 
    }).populate('client');

    console.log(`Found ${activeOrders.length} active orders:\n`);

    // First, reset all products' quantityRented to 0
    await Product.updateMany({}, { quantityRented: 0 });
    console.log('✅ Reset all products quantityRented to 0\n');

    // Now recalculate based on active orders
    for (const order of activeOrders) {
      console.log(`Processing Order #${order._id.toString().slice(-6)} (${order.client?.name || 'Unknown'})`);
      console.log(`Status: ${order.status}`);
      
      const orderItems = await OrderItem.find({ order: order._id }).populate('product');
      
      for (const item of orderItems) {
        if (item.product) {
          const product = await Product.findById(item.product._id);
          if (product) {
            const quantityToRent = item.quantityRented || 0;
            product.quantityRented += quantityToRent;
            await product.save();
            
            console.log(`  - ${item.product.name}: +${quantityToRent} rented (total now: ${product.quantityRented})`);
          }
        }
      }
      console.log('');
    }

    // Show final inventory status
    console.log('📊 Final Inventory Status:\n');
    const products = await Product.find().populate('category');
    
    for (const product of products) {
      const available = product.quantityInStock - product.quantityRented;
      console.log(`${product.name}:`);
      console.log(`  - In Stock: ${product.quantityInStock}`);
      console.log(`  - Rented: ${product.quantityRented}`);
      console.log(`  - Available: ${available}`);
      console.log('');
    }

    console.log('✅ Inventory fix complete!');

  } catch (error) {
    console.error('❌ Error fixing inventory:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixInventoryForActiveOrders();
