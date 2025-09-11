require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Get the connection string from environment or use default
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rental-app';
    console.log(`Connecting to: ${mongoUri.split('@').pop()}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // Check if users collection exists
    const usersCollection = collections.find(c => c.name === 'users');
    if (usersCollection) {
      console.log('\n✅ Users collection exists');
      
      // Count users
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      console.log(`Total users in database: ${userCount}`);
      
      // List admin users
      const adminUsers = await User.find({ role: 'Admin' });
      console.log(`\nAdmin users (${adminUsers.length}):`);
      adminUsers.forEach(user => {
        console.log(`- ${user.username} (${user.email})`);
      });
    } else {
      console.log('\n❌ Users collection does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nCould not connect to MongoDB. Please check:');
      console.error('1. Is MongoDB running?');
      console.error('2. Is the connection string correct?');
      console.error('3. Are the credentials correct?');
    }
    process.exit(1);
  }
}

testConnection();
