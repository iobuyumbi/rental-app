require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const ProductCategory = require('./models/ProductCategory');

const testAPIResponse = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Simulate the exact same query the API controller uses
    const products = await Product.find({}).populate('category', 'name');
    
    // Simulate the exact API response structure
    const apiResponse = {
      success: true,
      count: products.length,
      data: products
    };
    
    console.log('\n🔍 API Response Structure:');
    console.log('='.repeat(50));
    console.log('Response keys:', Object.keys(apiResponse));
    console.log('Response.data length:', apiResponse.data.length);
    console.log('Response.data[0] keys:', Object.keys(apiResponse.data[0] || {}));
    
    console.log('\n📦 First Product Details:');
    if (apiResponse.data[0]) {
      const product = apiResponse.data[0];
      console.log('Name:', product.name);
      console.log('quantityInStock:', product.quantityInStock);
      console.log('quantityRented:', product.quantityRented);
      console.log('availableQuantity (virtual):', product.availableQuantity);
      console.log('category object:', product.category);
      console.log('category name:', product.category?.name);
      console.log('rentalPrice:', product.rentalPrice);
    }
    
    console.log('\n🎯 Data Extraction Test:');
    console.log('result.data:', apiResponse.data ? 'EXISTS' : 'MISSING');
    console.log('result.data.length:', apiResponse.data?.length || 'N/A');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAPIResponse();
