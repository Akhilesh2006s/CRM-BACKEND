const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DcOrder = require('../models/DcOrder');
const User = require('../models/User');

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
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

const seedSavedDC = async () => {
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Find or get a user to use as created_by (required field)
    let user = await User.findOne();
    if (!user) {
      console.log('No users found. Creating a default user...');
      user = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Admin',
      });
      console.log('Created default user:', user._id);
    }

    // Create a sample Saved DC
    const savedDC = await DcOrder.create({
      school_name: 'Sample School - Saved DC',
      contact_person: 'John Doe',
      contact_mobile: '9876543210',
      email: 'sample.school@example.com',
      address: '123 Main Street, Sample City',
      school_type: 'Private',
      zone: 'North Zone',
      location: 'Sample City',
      products: [
        {
          product_name: 'Abacus',
          quantity: 50,
          unit_price: 1000,
        },
        {
          product_name: 'Vedic Maths',
          quantity: 30,
          unit_price: 1200,
        },
      ],
      priority: 'Hot',
      lead_status: 'Hot',
      status: 'saved',
      remarks: 'This is a seed data entry for Saved DC',
      created_by: user._id,
      total_amount: 86000, // (50 * 1000) + (30 * 1200)
    });

    console.log('\n✅ Successfully seeded Saved DC:');
    console.log('ID:', savedDC._id);
    console.log('DC Code:', savedDC.dc_code);
    console.log('School Name:', savedDC.school_name);
    console.log('Status:', savedDC.status);
    console.log('\nYou can now view this in the Saved DC page.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Saved DC:', error);
    process.exit(1);
  }
};

// Run the seed function
seedSavedDC();


