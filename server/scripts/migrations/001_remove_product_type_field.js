const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = require('../../config/db');

// Migration function
async function removeProductTypeField() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get the current connection
    const db = mongoose.connection.db;
    
    // Get the products collection
    const products = db.collection('products');
    
    // Remove the 'type' field from all products
    const result = await products.updateMany(
      {},
      { $unset: { type: "" } }
    );
    
    console.log(`Updated ${result.modifiedCount} products by removing the 'type' field`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
removeProductTypeField();
