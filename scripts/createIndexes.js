const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

dotenv.config();

const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/crm_system';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

const createIndexes = async () => {
  try {
    console.log('\n📊 Creating indexes to optimize queries...\n');

    // DC Model Indexes
    console.log('Creating indexes for DC model...');
    try {
      await DC.collection.createIndex({ employeeId: 1 }, { background: true });
      console.log('✅ Created index: { employeeId: 1 }');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Index { employeeId: 1 } already exists');
      } else {
        console.warn('⚠️  Could not create index { employeeId: 1 }:', err.message);
      }
    }

    try {
      await DC.collection.createIndex({ employeeId: 1, createdAt: -1 }, { background: true });
      console.log('✅ Created index: { employeeId: 1, createdAt: -1 }');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Index { employeeId: 1, createdAt: -1 } already exists');
      } else {
        console.warn('⚠️  Could not create index { employeeId: 1, createdAt: -1 }:', err.message);
      }
    }

    // DcOrder Model Indexes (verify they exist)
    console.log('\nVerifying indexes for DcOrder model...');
    const dcOrderIndexes = await DcOrder.collection.getIndexes();
    console.log('Existing DcOrder indexes:', Object.keys(dcOrderIndexes));

    // Check if compound index exists
    const hasCompoundIndex = Object.keys(dcOrderIndexes).some(key => 
      key.includes('assigned_to') && key.includes('status')
    );
    
    if (!hasCompoundIndex) {
      try {
        await DcOrder.collection.createIndex({ assigned_to: 1, status: 1 }, { background: true });
        console.log('✅ Created index: { assigned_to: 1, status: 1 }');
      } catch (err) {
        console.warn('⚠️  Could not create index:', err.message);
      }
    } else {
      console.log('ℹ️  Compound index { assigned_to: 1, status: 1 } already exists');
    }

    console.log('\n✅ Index creation complete!\n');
    console.log('📋 Summary of indexes:');
    console.log('DC Model:');
    console.log('  - { employeeId: 1 }');
    console.log('  - { status: 1, employeeId: 1 }');
    console.log('  - { employeeId: 1, createdAt: -1 }');
    console.log('  - { dcOrderId: 1 }');
    console.log('\nDcOrder Model:');
    console.log('  - { assigned_to: 1, status: 1 }');
    console.log('  - { assigned_to: 1 }');
    console.log('  - { status: 1 }');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the script
const run = async () => {
  const connected = await connectDB();
  if (connected) {
    await createIndexes();
  } else {
    console.error('Failed to connect to database');
    process.exit(1);
  }
};

run();












