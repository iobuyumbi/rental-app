const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixUserRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with capitalized roles
    const users = await User.find({});
    console.log(`Found ${users.length} user(s)`);

    for (const user of users) {
      console.log(`User: ${user.username}, Current Role: ${user.role}`);
      
      // Normalize role to lowercase
      const normalizedRole = user.role.toLowerCase();
      
      if (user.role !== normalizedRole) {
        // Update the role using direct MongoDB update to bypass validation
        await User.updateOne(
          { _id: user._id },
          { $set: { role: normalizedRole } }
        );
        console.log(`✅ Updated ${user.username} role from "${user.role}" to "${normalizedRole}"`);
      } else {
        console.log(`✓ ${user.username} role is already correct: "${user.role}"`);
      }
    }

    console.log('\n✅ All user roles have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user roles:', error);
    process.exit(1);
  }
};

fixUserRole();
