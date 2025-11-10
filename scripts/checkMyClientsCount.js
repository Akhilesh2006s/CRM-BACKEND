const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

async function checkMyClientsCount() {
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

    console.log(`\nChecking "My Clients" for: ${user.name} (${user.email})\n`);

    // Get DCs assigned to this employee with status 'created' or 'po_submitted'
    // This matches the frontend filter in My Clients page
    const dcsInMyClients = await DC.find({
      employeeId: user._id,
      status: { $in: ['created', 'po_submitted'] }
    }).select('customerName status dcOrderId');

    console.log(`DCs with status 'created' or 'po_submitted': ${dcsInMyClients.length}`);
    dcsInMyClients.forEach((dc, idx) => {
      const name = dc.customerName || (dc.dcOrderId && typeof dc.dcOrderId === 'object' ? dc.dcOrderId.school_name : 'N/A');
      console.log(`  ${idx + 1}. ${name} - Status: ${dc.status}`);
    });

    // Get DcOrders with 'saved' status assigned to this employee
    // These are converted leads that should appear in My Clients (backend converts them to 'created' status)
    const savedDcOrders = await DcOrder.find({
      assigned_to: user._id,
      status: 'saved'
    })
      .select('school_name updatedAt')
      .sort({ updatedAt: -1 });

    console.log(`\nSaved DcOrders (converted leads): ${savedDcOrders.length}`);
    savedDcOrders.forEach((order, idx) => {
      console.log(`  ${idx + 1}. ${order.school_name || 'N/A'} - Updated: ${order.updatedAt}`);
    });

    // Check which saved DcOrders already have a DC
    const savedOrderIds = savedDcOrders.map(o => o._id);
    const existingDCsForSavedOrders = await DC.find({
      employeeId: user._id,
      dcOrderId: { $in: savedOrderIds }
    }).select('dcOrderId');

    const existingDcOrderIds = new Set(
      existingDCsForSavedOrders.map(dc => 
        typeof dc.dcOrderId === 'object' ? dc.dcOrderId._id.toString() : dc.dcOrderId.toString()
      )
    );

    // Count saved DcOrders that don't have a DC yet (these will appear in My Clients)
    const savedOrdersWithoutDC = savedDcOrders.filter(order => 
      !existingDcOrderIds.has(order._id.toString())
    );

    console.log(`\nSaved DcOrders without DC (will appear in My Clients): ${savedOrdersWithoutDC.length}`);

    // Total that will appear in My Clients
    const totalInMyClients = dcsInMyClients.length + savedOrdersWithoutDC.length;

    console.log(`\n=== "MY CLIENTS" PAGE COUNT ===`);
    console.log(`Total clients that will appear: ${totalInMyClients}`);
    console.log(`  - DCs with 'created' or 'po_submitted' status: ${dcsInMyClients.length}`);
    console.log(`  - Saved DcOrders without DC: ${savedOrdersWithoutDC.length}`);

    // Breakdown by status
    const createdCount = dcsInMyClients.filter(dc => dc.status === 'created').length;
    const poSubmittedCount = dcsInMyClients.filter(dc => dc.status === 'po_submitted').length;
    
    console.log(`\nBreakdown:`);
    console.log(`  - Status 'created': ${createdCount}`);
    console.log(`  - Status 'po_submitted': ${poSubmittedCount}`);
    console.log(`  - Saved DcOrders (shown as 'created'): ${savedOrdersWithoutDC.length}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMyClientsCount();

