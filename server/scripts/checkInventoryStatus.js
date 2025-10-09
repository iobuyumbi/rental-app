const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/rental-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkInventoryStatus() {
  try {
    console.log('🔍 Checking Inventory Status...\n');

    // Get all products
    const products = await Product.find().populate('category');
    console.log(`📦 Found ${products.length} products:\n`);

    for (const product of products) {
      console.log(`Product: ${product.name}`);
      console.log(`  - In Stock: ${product.quantityInStock}`);
      console.log(`  - Rented: ${product.quantityRented}`);
      console.log(`  - Available: ${product.quantityInStock - product.quantityRented}`);
      console.log('');
    }

    // Get all orders
    const orders = await Order.find().populate('client');
    console.log(`📋 Found ${orders.length} total orders:\n`);

    const ordersByStatus = {};
    orders.forEach(order => {
      if (!ordersByStatus[order.status]) {
        ordersByStatus[order.status] = [];
      }
      ordersByStatus[order.status].push(order);
    });

    for (const [status, statusOrders] of Object.entries(ordersByStatus)) {
      console.log(`${status.toUpperCase()}: ${statusOrders.length} orders`);
      
      if (status === 'in_progress' || status === 'confirmed') {
        for (const order of statusOrders) {
          console.log(`  - Order ${order._id.toString().slice(-6)} (${order.client?.name || 'Unknown'})`);
          
          // Get order items
          const orderItems = await OrderItem.find({ order: order._id }).populate('product');
          for (const item of orderItems) {
            console.log(`    * ${item.product?.name}: ${item.quantityRented} rented`);
          }
        }
      }
    }

    // Check for discrepancies
    console.log('\n🔍 Checking for discrepancies...\n');
    
    for (const product of products) {
      // Calculate expected rented quantity from active orders
      const activeOrders = await Order.find({ 
        status: { $in: ['in_progress', 'confirmed'] } 
      });
      
      let calculatedRented = 0;
      for (const order of activeOrders) {
        const orderItems = await OrderItem.find({ 
          order: order._id, 
          product: product._id 
        });
        
        for (const item of orderItems) {
          calculatedRented += item.quantityRented || 0;
        }
      }
      
      if (calculatedRented !== product.quantityRented) {
        console.log(`⚠️  DISCREPANCY for ${product.name}:`);
        console.log(`   Database shows: ${product.quantityRented} rented`);
        console.log(`   Should be: ${calculatedRented} rented`);
        console.log(`   Difference: ${calculatedRented - product.quantityRented}`);
        console.log('');
      }
    }

    console.log('✅ Inventory status check complete!');

  } catch (error) {
    console.error('❌ Error checking inventory status:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkInventoryStatus();
