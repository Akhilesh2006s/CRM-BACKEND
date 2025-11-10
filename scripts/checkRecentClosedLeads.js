const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

async function checkRecentClosedLeads() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm-forge');
    console.log('Connected to database\n');

    // Find all DcOrders with status 'saved' (closed leads) from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const savedDcOrders = await DcOrder.find({
      status: 'saved',
      updatedAt: { $gte: sevenDaysAgo }
    })
      .populate('assigned_to', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`Found ${savedDcOrders.length} closed leads (saved DcOrders) in the last 7 days:\n`);

    for (const order of savedDcOrders) {
      console.log(`\n=== ${order.school_name || 'N/A'} ===`);
      console.log(`DcOrder ID: ${order._id}`);
      console.log(`Status: ${order.status}`);
      console.log(`Assigned To: ${order.assigned_to ? (typeof order.assigned_to === 'object' ? `${order.assigned_to.name} (${order.assigned_to.email})` : order.assigned_to) : 'N/A'}`);
      console.log(`Updated: ${order.updatedAt}`);

      // Check if DC exists for this DcOrder
      const dc = await DC.findOne({
        dcOrderId: order._id
      })
        .populate('employeeId', 'name email')
        .lean();

      if (dc) {
        console.log(`\n✅ DC EXISTS:`);
        console.log(`  DC ID: ${dc._id}`);
        console.log(`  Status: ${dc.status}`);
        console.log(`  Employee: ${dc.employeeId ? (typeof dc.employeeId === 'object' ? `${dc.employeeId.name} (${dc.employeeId.email})` : dc.employeeId) : 'N/A'}`);
        console.log(`  Created: ${dc.createdAt}`);
        console.log(`  Will appear in "My Clients"? ${dc.status === 'created' || dc.status === 'po_submitted' ? 'YES ✅' : 'NO ❌'}`);
        
        // Check if employeeId matches assigned_to
        const dcEmployeeId = dc.employeeId ? (typeof dc.employeeId === 'object' ? dc.employeeId._id.toString() : dc.employeeId.toString()) : null;
        const orderAssignedId = order.assigned_to ? (typeof order.assigned_to === 'object' ? order.assigned_to._id.toString() : order.assigned_to.toString()) : null;
        if (dcEmployeeId !== orderAssignedId) {
          console.log(`  ⚠️  WARNING: DC employeeId (${dcEmployeeId}) does NOT match DcOrder assigned_to (${orderAssignedId})`);
        }
      } else {
        console.log(`\n❌ NO DC FOUND for this closed lead!`);
        console.log(`  This closed lead should have a DC but it doesn't exist.`);
      }
    }

    // Also check for DCs created in the last 7 days with status 'created' or 'po_submitted'
    const recentDCs = await DC.find({
      status: { $in: ['created', 'po_submitted'] },
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('employeeId', 'name email')
      .populate('dcOrderId', 'school_name status')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n\n=== RECENT DCs WITH STATUS 'created' OR 'po_submitted' (last 7 days) ===`);
    console.log(`Found ${recentDCs.length} DCs:\n`);

    for (const dc of recentDCs) {
      console.log(`\n=== ${dc.customerName || 'N/A'} ===`);
      console.log(`DC ID: ${dc._id}`);
      console.log(`Status: ${dc.status}`);
      console.log(`Employee: ${dc.employeeId ? (typeof dc.employeeId === 'object' ? `${dc.employeeId.name} (${dc.employeeId.email})` : dc.employeeId) : 'N/A'}`);
      console.log(`DcOrder: ${dc.dcOrderId ? (typeof dc.dcOrderId === 'object' ? `${dc.dcOrderId.school_name} (status: ${dc.dcOrderId.status})` : dc.dcOrderId) : 'N/A'}`);
      console.log(`Created: ${dc.createdAt}`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecentClosedLeads();

