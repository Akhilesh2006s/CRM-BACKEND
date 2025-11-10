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

const seedClosedSales = async () => {
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Find or get users to use as created_by and assigned_to
    let adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      adminUser = await User.findOne();
    }
    if (!adminUser) {
      console.log('No users found. Creating a default admin user...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Admin',
      });
      console.log('Created default admin user:', adminUser._id);
    }

    // Find or get an employee for assigned_to
    let employeeUser = await User.findOne({ role: 'Employee' });
    if (!employeeUser) {
      // Create an employee user if none exists
      employeeUser = await User.create({
        name: 'Test Employee',
        email: 'employee@example.com',
        password: 'password123',
        role: 'Employee',
      });
      console.log('Created default employee user:', employeeUser._id);
    }

    // Create sample Closed Sales (DcOrders with status 'completed')
    const closedSales = [
      {
        school_name: 'ABC Public School',
        contact_person: 'Principal Rajesh Kumar',
        contact_mobile: '9876543210',
        email: 'abc.school@example.com',
        address: '123 Education Street, Mumbai',
        school_type: 'Private',
        zone: 'North Zone',
        location: 'Mumbai',
        cluster: 'Cluster A',
        products: [
          {
            product_name: 'Abacus',
            quantity: 100,
            unit_price: 1000,
          },
          {
            product_name: 'Vedic Maths',
            quantity: 50,
            unit_price: 1200,
          },
        ],
        priority: 'Hot',
        lead_status: 'Hot',
        status: 'completed',
        remarks: 'High priority school, ready for DC',
        created_by: adminUser._id,
        assigned_to: employeeUser._id,
        total_amount: 160000, // (100 * 1000) + (50 * 1200)
      },
      {
        school_name: 'XYZ International School',
        contact_person: 'Dr. Priya Sharma',
        contact_mobile: '9876543211',
        email: 'xyz.school@example.com',
        address: '456 Knowledge Road, Delhi',
        school_type: 'Public',
        zone: 'South Zone',
        location: 'Delhi',
        cluster: 'Cluster B',
        products: [
          {
            product_name: 'IIT',
            quantity: 75,
            unit_price: 1500,
          },
          {
            product_name: 'CodeChamp',
            quantity: 40,
            unit_price: 1800,
          },
        ],
        priority: 'Hot',
        lead_status: 'Hot',
        status: 'completed',
        remarks: 'International curriculum school',
        created_by: adminUser._id,
        assigned_to: employeeUser._id,
        total_amount: 172500, // (75 * 1500) + (40 * 1800)
      },
      {
        school_name: 'Modern Learning Academy',
        contact_person: 'Mr. Amit Patel',
        contact_mobile: '9876543212',
        email: 'modern.school@example.com',
        address: '789 Innovation Avenue, Bangalore',
        school_type: 'Private',
        zone: 'East Zone',
        location: 'Bangalore',
        cluster: 'Cluster C',
        products: [
          {
            product_name: 'EEL',
            quantity: 60,
            unit_price: 1100,
          },
          {
            product_name: 'Math Lab',
            quantity: 35,
            unit_price: 2000,
          },
        ],
        priority: 'Warm',
        lead_status: 'Warm',
        status: 'completed',
        remarks: 'Focus on STEM education',
        created_by: adminUser._id,
        assigned_to: employeeUser._id,
        total_amount: 136000, // (60 * 1100) + (35 * 2000)
      },
    ];

    const createdOrders = [];
    for (const saleData of closedSales) {
      try {
        const order = await DcOrder.create(saleData);
        createdOrders.push(order);
        console.log(`✅ Created closed sale: ${order.school_name} (${order.dc_code})`);
      } catch (error) {
        console.error(`❌ Failed to create closed sale ${saleData.school_name}:`, error.message);
      }
    }

    console.log('\n✅ Successfully seeded Closed Sales:');
    console.log(`Created ${createdOrders.length} closed sales`);
    console.log('\nThese will appear in the Closed Sales page with:');
    console.log('- Update DC / Raise DC button (for Coordinator and Employee)');
    console.log('- Save DC button');
    console.log('- Submit to Senior Coordinator button');
    console.log('\nYou can now test the new functionality in the Closed Sales page.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Closed Sales:', error);
    process.exit(1);
  }
};

// Run the seed function
seedClosedSales();

