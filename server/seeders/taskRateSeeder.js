require('dotenv').config();
const mongoose = require('mongoose');
const TaskRate = require('../models/TaskRate');
const connectDB = require('../config/db');

// Default task rates for common rental business tasks
const defaultTaskRates = [
  // Dispatch Tasks
  {
    taskType: 'dispatch',
    taskName: 'Chair Dispatch',
    ratePerUnit: 0.50,
    unit: 'per chair',
    description: 'Loading and dispatching chairs for events',
    active: true
  },
  {
    taskType: 'dispatch',
    taskName: 'Table Dispatch',
    ratePerUnit: 5.00,
    unit: 'per table',
    description: 'Loading and dispatching tables for events',
    active: true
  },
  {
    taskType: 'dispatch',
    taskName: 'Tent Dispatch',
    ratePerUnit: 50.00,
    unit: 'per tent',
    description: 'Loading and dispatching tents for events',
    active: true
  },

  // Loading Tasks
  {
    taskType: 'loading',
    taskName: 'Truck Loading',
    ratePerUnit: 200.00,
    unit: 'per truck load',
    description: 'Loading rental items onto delivery trucks',
    active: true
  },
  {
    taskType: 'loading',
    taskName: 'pickup Loading',
    ratePerUnit: 100.00,
    unit: 'per pickup load',
    description: 'Loading rental items onto delivery pickups',
    active: true
  },

  // Receiving Tasks
  {
    taskType: 'receiving',
    taskName: 'Item Return Processing',
    ratePerUnit: 12.50,
    unit: 'per item',
    description: 'Receiving and checking returned rental items',
    active: true
  },
  {
    taskType: 'receiving',
    taskName: 'Bulk Return Processing',
    ratePerUnit: 500.00,
    unit: 'per batch',
    description: 'Processing large batches of returned items',
    active: true
  },

  // Cleaning Tasks
  {
    taskType: 'cleaning',
    taskName: 'Chair Cleaning',
    ratePerUnit: 3.50,
    unit: 'per chair',
    description: 'Cleaning and sanitizing chairs',
    active: true
  },
  {
    taskType: 'cleaning',
    taskName: 'Table Cleaning',
    ratePerUnit: 10.00,
    unit: 'per table',
    description: 'Cleaning and sanitizing tables',
    active: true
  },
  {
    taskType: 'cleaning',
    taskName: 'Double Peak Tent Cleaning',
    ratePerUnit: 250.00,
    unit: 'per tent',
    description: 'Cleaning and maintaining tents',
    active: true
  },

  {
    taskType: 'cleaning',
    taskName: 'Single Peak Tent Cleaning',
    ratePerUnit: 150.00,
    unit: 'per tent',
    description: 'Cleaning and maintaining tents',
    active: true
  },

  {
    taskType: 'cleaning',
    taskName: 'Gazebo Tent Cleaning',
    ratePerUnit: 100.00,
    unit: 'per tent',
    description: 'Cleaning and maintaining tents',
    active: true
  },

  {
    taskType: 'cleaning',
    taskName: 'Tent Side Flap Cleaning',
    ratePerUnit: 50.00,
    unit: 'per tent',
    description: 'Cleaning and maintaining tents',
    active: true
  },

  {
    taskType: 'cleaning',
    taskName: 'Gebo Tent Cleaning',
    ratePerUnit: 200.00,
    unit: 'per tent',
    description: 'Cleaning and maintaining tents',
    active: true
  },

  // Setup Tasks
  {
    taskType: 'setup',
    taskName: 'Event Setup',
    ratePerUnit: 2500.00,
    unit: 'per event',
    description: 'Setting up rental items at event venue',
    active: true
  },
  {
    taskType: 'setup',
    taskName: 'Tent Setup',
    ratePerUnit: 1250.00,
    unit: 'per tent',
    description: 'Setting up tents at event venue',
    active: true
  },

  // Breakdown Tasks
  {
    taskType: 'breakdown',
    taskName: 'Event Breakdown',
    ratePerUnit: 2000.00,
    unit: 'per event',
    description: 'Breaking down and packing rental items after event',
    active: true
  },
  {
    taskType: 'breakdown',
    taskName: 'Tent Breakdown',
    ratePerUnit: 1000.00,
    unit: 'per tent',
    description: 'Breaking down tents after event',
    active: true
  },

  // Delivery Tasks
  {
    taskType: 'delivery',
    taskName: 'Local Delivery',
    ratePerUnit: 1500.00,
    unit: 'per delivery',
    description: 'Delivering rental items to local venues',
    active: true
  },
  {
    taskType: 'delivery',
    taskName: 'Long Distance Delivery',
    ratePerUnit: 3000.00,
    unit: 'per delivery',
    description: 'Delivering rental items to distant venues',
    active: true
  },

  // Pickup Tasks
  {
    taskType: 'pickup',
    taskName: 'Local Pickup',
    ratePerUnit: 1250.00,
    unit: 'per pickup',
    description: 'Picking up rental items from local venues',
    active: true
  },
  {
    taskType: 'pickup',
    taskName: 'Long Distance Pickup',
    ratePerUnit: 2500.00,
    unit: 'per pickup',
    description: 'Picking up rental items from distant venues',
    active: true
  }
];

const seedTaskRates = async () => {
  try {
    console.log('Starting task rate seeder...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    
    // Connect to database
    await connectDB();
    console.log('Connected to database successfully');

    // Clear existing task rates
    await TaskRate.deleteMany({});
    console.log('Cleared existing task rates');

    // Create a default admin user ID (you should replace this with actual admin user ID)
    const defaultAdminId = new mongoose.Types.ObjectId();

    // Add createdBy field to all task rates
    const taskRatesWithAdmin = defaultTaskRates.map(rate => ({
      ...rate,
      createdBy: defaultAdminId
    }));

    // Insert default task rates
    const insertedRates = await TaskRate.insertMany(taskRatesWithAdmin);
    console.log(`Successfully seeded ${insertedRates.length} task rates`);

    // Log summary by task type
    const summary = {};
    insertedRates.forEach(rate => {
      if (!summary[rate.taskType]) {
        summary[rate.taskType] = 0;
      }
      summary[rate.taskType]++;
    });

    console.log('\nTask rates summary by type:');
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} rates`);
    });

    console.log('\nTask rate seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding task rates:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedTaskRates();
}

module.exports = { seedTaskRates, defaultTaskRates };
