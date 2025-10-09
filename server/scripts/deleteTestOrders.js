const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
require('dotenv').config();

const deleteTestOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all orders with 0 items or created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({
      createdAt: { $gte: today }
    });
    
    console.log(`\nFound ${orders.length} order(s) created today:`);
    
    for (const order of orders) {
      // Get order items
      const orderItems = await OrderItem.find({ order: order._id });
      console.log(`\nOrder ID: ${order._id}`);
      console.log(`Client: ${order.client}`);
      console.log(`Total Amount: ${order.totalAmount}`);
      console.log(`Items: ${orderItems.length}`);
      console.log(`Created: ${order.createdAt}`);
    }
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete all orders shown above!');
    console.log('\nTo delete these orders:');
    console.log('1. Review the list above');
    console.log('2. Uncomment the deletion code in the script');
    console.log('3. Run the script again');
    
    // Uncomment the code below to actually delete the orders
    /*
    console.log('\n🗑️  Deleting orders...');
    
    for (const order of orders) {
      // Delete order items first
      const deletedItems = await OrderItem.deleteMany({ order: order._id });
      console.log(`Deleted ${deletedItems.deletedCount} items for order ${order._id}`);
      
      // Restore product quantities
      const orderItems = await OrderItem.find({ order: order._id });
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantityRented -= item.quantityRented;
          await product.save();
          console.log(`Restored ${item.quantityRented} units to product ${product.name}`);
        }
      }
      
      // Delete the order
      await Order.findByIdAndDelete(order._id);
      console.log(`✅ Deleted order ${order._id}`);
    }
    
    console.log(`\n✅ Successfully deleted ${orders.length} order(s)!`);
    */
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteTestOrders();
