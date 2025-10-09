const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const fixProductConditions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} product(s)`);

    const conditionMap = {
      'Good': 'good',
      'Fair': 'fair',
      'Needs Repair': 'needs_repair',
      'needs repair': 'needs_repair',
      'GOOD': 'good',
      'FAIR': 'fair'
    };

    let updatedCount = 0;

    for (const product of products) {
      console.log(`Product: ${product.name}, Current Condition: ${product.condition}`);
      
      // Check if condition needs normalization
      const normalizedCondition = conditionMap[product.condition] || product.condition.toLowerCase().replace(/\s+/g, '_');
      
      if (product.condition !== normalizedCondition) {
        // Update the condition using direct MongoDB update to bypass validation
        await Product.updateOne(
          { _id: product._id },
          { $set: { condition: normalizedCondition } }
        );
        console.log(`✅ Updated ${product.name} condition from "${product.condition}" to "${normalizedCondition}"`);
        updatedCount++;
      } else {
        console.log(`✓ ${product.name} condition is already correct: "${product.condition}"`);
      }
    }

    console.log(`\n✅ Fixed ${updatedCount} product condition(s)!`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing product conditions:', error);
    process.exit(1);
  }
};

fixProductConditions();
