require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const ProductCategory = require('./models/ProductCategory');

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const products = await Product.find({}).populate('category', 'name type');
    
    console.log('\n📦 Products in database:');
    console.log('='.repeat(50));
    
    products.forEach(product => {
      console.log(`Product: ${product.name}`);
      console.log(`  Stock: ${product.quantityInStock} in stock, ${product.quantityRented} rented`);
      console.log(`  Available: ${product.quantityInStock - product.quantityRented}`);
      console.log(`  Category: ${product.category?.name || 'No Category'} (ID: ${product.category?._id || 'None'})`);
      console.log(`  Price: KES ${product.rentalPrice}`);
      console.log('---');
    });
    
    console.log(`\nTotal products: ${products.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkProducts();
