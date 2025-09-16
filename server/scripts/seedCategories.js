const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategory');
require('dotenv').config();

// Define category types for rental business
const CATEGORY_TYPES = ['TENT', 'CHAIR', 'TABLE', 'UTENSIL', 'EQUIPMENT', 'FURNITURE', 'LIGHTING', 'SOUND', 'OTHER'];

// Sample category data
const categoryData = [
  {
    name: 'Party Tents',
    type: 'TENT',
    description: 'Large tents for events and parties',
    rentalPriceMultiplier: 1.5,
    requiresMaintenance: true,
    maintenanceIntervalDays: 30
  },
  {
    name: 'Folding Chairs',
    type: 'CHAIR',
    description: 'Standard folding chairs for events',
    rentalPriceMultiplier: 1.0,
    requiresMaintenance: false
  },
  {
    name: 'Banquet Tables',
    type: 'TABLE',
    description: 'Large tables for banquets and events',
    rentalPriceMultiplier: 1.2,
    requiresMaintenance: true,
    maintenanceIntervalDays: 60
  },
  {
    name: 'Silverware Sets',
    type: 'UTENSIL',
    description: 'Complete silverware sets for formal dining',
    rentalPriceMultiplier: 0.8,
    requiresMaintenance: true,
    maintenanceIntervalDays: 15
  },
  {
    name: 'PA Systems',
    type: 'SOUND',
    description: 'Professional sound systems for events',
    rentalPriceMultiplier: 2.0,
    requiresMaintenance: true,
    maintenanceIntervalDays: 45
  },
  {
    name: 'LED Lighting',
    type: 'LIGHTING',
    description: 'Modern LED lighting for events',
    rentalPriceMultiplier: 1.3,
    requiresMaintenance: true,
    maintenanceIntervalDays: 30
  },
  {
    name: 'Lounge Furniture',
    type: 'FURNITURE',
    description: 'Comfortable lounge furniture for events',
    rentalPriceMultiplier: 1.8,
    requiresMaintenance: true,
    maintenanceIntervalDays: 60
  },
  {
    name: 'Generators',
    type: 'EQUIPMENT',
    description: 'Portable power generators for outdoor events',
    rentalPriceMultiplier: 2.5,
    requiresMaintenance: true,
    maintenanceIntervalDays: 30
  },
  {
    name: 'Decorative Items',
    type: 'OTHER',
    description: 'Various decorative items for events',
    rentalPriceMultiplier: 0.7,
    requiresMaintenance: false
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Check if categories already exist
    const existingCategories = await ProductCategory.find({});
    console.log(`Found ${existingCategories.length} existing categories`);

    if (existingCategories.length === 0) {
      // Insert categories
      const result = await ProductCategory.insertMany(categoryData);
      console.log(`Added ${result.length} categories to the database`);
    } else {
      console.log('Categories already exist. No new categories added.');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCategories();