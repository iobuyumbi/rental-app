const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
require('dotenv').config();

const deleteAllOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count before deletion
    const orderCount = await Order.countDocuments();
    const itemCount = await OrderItem.countDocuments();
    
    console.log(`📊 Current data:`);
    console.log(`   Orders: ${orderCount}`);
    console.log(`   Order Items: ${itemCount}\n`);

    if (orderCount === 0) {
      console.log('✓ No orders to delete');
      process.exit(0);
    }

    // Delete all order items
    const deletedItems = await OrderItem.deleteMany({});
    console.log(`🗑️  Deleted ${deletedItems.deletedCount} order items`);

    // Delete all orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`🗑️  Deleted ${deletedOrders.deletedCount} orders`);

    console.log('\n✅ All orders and items have been deleted!');
    console.log('\n⚠️  Note: Product quantities were NOT restored.');
    console.log('   If needed, you can manually update product quantities.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteAllOrders();
