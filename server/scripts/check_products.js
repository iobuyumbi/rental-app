require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function checkProducts() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).limit(5).toArray();
    
    console.log('Sample of products:');
    console.log(JSON.stringify(products, null, 2));
    
    // Check if any product still has the 'type' field
    const productWithType = await db.collection('products').findOne({ type: { $exists: true } });
    if (productWithType) {
      console.log('\nWARNING: Some products still have the type field:', productWithType._id);
    } else {
      console.log('\nSUCCESS: No products found with the type field');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error checking products:', error);
    process.exit(1);
  }
}

checkProducts();
