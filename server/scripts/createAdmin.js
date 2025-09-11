require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rental-app';

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists:', adminExists.email);
      process.exit(0);
    }

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed by the User model pre-save hook
      name: 'Admin User',
      role: 'Admin', // Must match the enum value in the User model
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('----------------------------------');
    console.log('🔑 Login with these credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('----------------------------------');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
