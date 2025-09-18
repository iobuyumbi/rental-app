require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

const defaultProducts = [
  {
    name: 'Plastic Chairs',
    categoryName: 'Folding Chairs', // We'll find the category by name
    rentalPrice: 15,
    purchasePrice: 500,
    quantityInStock: 4000,
    quantityRented: 0,
    condition: 'Good',
    description: 'Standard plastic chairs for events'
  },
  {
    name: 'Double Peak Tent',
    categoryName: 'Party Tents', // We'll find the category by name
    rentalPrice: 3000,
    purchasePrice: 25000,
    quantityInStock: 50,
    quantityRented: 0,
    condition: 'Good',
    description: 'Large double peak tent for outdoor events'
  },
  {
    name: 'Banquet Tables',
    categoryName: 'Banquet Tables',
    rentalPrice: 200,
    purchasePrice: 2000,
    quantityInStock: 100,
    quantityRented: 0,
    condition: 'Good',
    description: 'Standard banquet tables for events'
  },
  {
    name: 'LED Lighting System',
    categoryName: 'LED Lighting',
    rentalPrice: 500,
    purchasePrice: 5000,
    quantityInStock: 25,
    quantityRented: 0,
    condition: 'Good',
    description: 'Professional LED lighting for events'
  }
];

const seedProducts = async () => {
  try {
    console.log('🌱 Starting product seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories to map names to IDs
    const categories = await ProductCategory.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('📋 Available categories:', Object.keys(categoryMap));

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Create products
    const productsToCreate = [];
    for (const productData of defaultProducts) {
      const { categoryName, ...productInfo } = productData;
      
      // Find category ID
      const categoryId = categoryMap[categoryName];
      if (!categoryId) {
        console.log(`⚠️  Category "${categoryName}" not found, skipping product "${productData.name}"`);
        continue;
      }

      productsToCreate.push({
        ...productInfo,
        category: categoryId
      });
    }

    if (productsToCreate.length > 0) {
      const createdProducts = await Product.insertMany(productsToCreate);
      console.log(`✅ Created ${createdProducts.length} products:`);
      
      for (const product of createdProducts) {
        const populatedProduct = await Product.findById(product._id).populate('category', 'name');
        console.log(`   - ${populatedProduct.name}: ${populatedProduct.quantityInStock} in stock (${populatedProduct.category.name})`);
      }
    } else {
      console.log('❌ No products created - categories not found');
    }

    console.log('\n📊 Product seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts, defaultProducts };
