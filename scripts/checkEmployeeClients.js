const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

async function checkEmployeeClients() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm-forge');
    console.log('Connected to database');

    const email = 'amenityforge1@gmail.com';
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log(`\nFound user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user._id}`);
    console.log(`Role: ${user.role}\n`);

    // Count DCs assigned to this employee
    const dcCount = await DC.countDocuments({ employeeId: user._id });
    console.log(`DCs (clients) assigned: ${dcCount}`);

    // Count DcOrders with 'saved' status assigned to this employee
    const savedDcOrdersCount = await DcOrder.countDocuments({
      assigned_to: user._id,
      status: 'saved'
    });
    console.log(`Saved DcOrders (converted leads): ${savedDcOrdersCount}`);

    // Get detailed list
    const dcs = await DC.find({ employeeId: user._id })
      .populate('dcOrderId', 'school_name')
      .select('customerName status createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`\nRecent DCs (first 20):`);
    dcs.forEach((dc, idx) => {
      console.log(`${idx + 1}. ${dc.customerName || dc.dcOrderId?.school_name || 'N/A'} - Status: ${dc.status} - Created: ${dc.createdAt}`);
    });

    const savedOrders = await DcOrder.find({
      assigned_to: user._id,
      status: 'saved'
    })
      .select('school_name updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    console.log(`\nRecent Saved DcOrders (first 20):`);
    savedOrders.forEach((order, idx) => {
      console.log(`${idx + 1}. ${order.school_name || 'N/A'} - Updated: ${order.updatedAt}`);
    });

    const totalClients = dcCount + savedDcOrdersCount;
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Clients: ${totalClients}`);
    console.log(`  - DCs: ${dcCount}`);
    console.log(`  - Saved DcOrders: ${savedDcOrdersCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmployeeClients();

