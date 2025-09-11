require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdminDirect() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rental-app';
  const client = new MongoClient(mongoUri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    // Check if admin already exists
    const adminExists = await users.findOne({ role: 'Admin' });
    if (adminExists) {
      console.log('ℹ️ Admin user already exists:');
      console.log(`   Username: ${adminExists.username}`);
      console.log(`   Email: ${adminExists.email}`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const result = await users.insertOne({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (result.acknowledged) {
      console.log('\n✅ Admin user created successfully!');
      console.log('----------------------------------');
      console.log('🔑 Login with these credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('----------------------------------');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
    } else {
      console.log('❌ Failed to create admin user');
    }
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nCould not connect to MongoDB. Please check:');
      console.error('1. Is MongoDB running?');
      console.error('2. Is the connection string correct?');
      console.error('3. Are the credentials correct?');
    }
  } finally {
    await client.close();
  }
}

// Run the script
createAdminDirect();
