const mongoose = require('mongoose');
require('dotenv').config();
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
require('../models/User'); // Register User model

async function checkSubmittedRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check DCs with status 'sent_to_manager'
    console.log('📊 Checking DCs with status "sent_to_manager"...');
    const dcsWithSentToManager = await DC.find({ status: 'sent_to_manager' })
      .select('_id dcOrderId employeeId customerName status createdAt')
      .populate('dcOrderId', 'school_name status')
      .populate('employeeId', 'name')
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${dcsWithSentToManager.length} DCs with status 'sent_to_manager':`);
    dcsWithSentToManager.forEach((dc, idx) => {
      console.log(`\n${idx + 1}. DC ID: ${dc._id}`);
      console.log(`   Customer: ${dc.customerName || dc.dcOrderId?.school_name || 'N/A'}`);
      console.log(`   Employee: ${dc.employeeId?.name || 'N/A'}`);
      console.log(`   DC Status: ${dc.status}`);
      console.log(`   DcOrder ID: ${dc.dcOrderId?._id || 'N/A'}`);
      console.log(`   DcOrder Status: ${dc.dcOrderId?.status || 'N/A'}`);
      console.log(`   Created: ${new Date(dc.createdAt).toLocaleString()}`);
    });

    // Check DcOrders with status 'dc_requested'
    console.log('\n\n📊 Checking DcOrders with status "dc_requested"...');
    const dcOrdersRequested = await DcOrder.find({ status: 'dc_requested' })
      .select('_id school_name status assigned_to createdAt')
      .populate('assigned_to', 'name')
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${dcOrdersRequested.length} DcOrders with status 'dc_requested':`);
    dcOrdersRequested.forEach((order, idx) => {
      console.log(`\n${idx + 1}. DcOrder ID: ${order._id}`);
      console.log(`   School: ${order.school_name || 'N/A'}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Assigned To: ${order.assigned_to?.name || 'N/A'}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
    });

    // Check DcOrders with status 'saved' (converted leads)
    console.log('\n\n📊 Checking DcOrders with status "saved" (converted leads)...');
    const dcOrdersSaved = await DcOrder.find({ status: 'saved' })
      .select('_id school_name status assigned_to createdAt')
      .populate('assigned_to', 'name')
      .limit(10)
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${dcOrdersSaved.length} DcOrders with status 'saved' (showing first 10):`);
    dcOrdersSaved.forEach((order, idx) => {
      console.log(`\n${idx + 1}. DcOrder ID: ${order._id}`);
      console.log(`   School: ${order.school_name || 'N/A'}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Assigned To: ${order.assigned_to?.name || 'N/A'}`);
    });

    // Check if there are DCs linked to saved DcOrders
    console.log('\n\n📊 Checking DCs linked to saved DcOrders...');
    const savedDcOrderIds = dcOrdersSaved.map(o => o._id);
    if (savedDcOrderIds.length > 0) {
      const dcsLinkedToSaved = await DC.find({ 
        dcOrderId: { $in: savedDcOrderIds },
        status: 'sent_to_manager'
      })
        .select('_id dcOrderId customerName status')
        .populate('dcOrderId', 'school_name status')
        .lean()
        .maxTimeMS(10000);
      
      console.log(`Found ${dcsLinkedToSaved.length} DCs with status 'sent_to_manager' linked to saved DcOrders:`);
      dcsLinkedToSaved.forEach((dc, idx) => {
        console.log(`\n${idx + 1}. DC ID: ${dc._id}`);
        console.log(`   Customer: ${dc.customerName || dc.dcOrderId?.school_name || 'N/A'}`);
        console.log(`   DC Status: ${dc.status}`);
        console.log(`   DcOrder Status: ${dc.dcOrderId?.status || 'N/A'}`);
        if (dc.dcOrderId?.status !== 'dc_requested') {
          console.log(`   ⚠️  WARNING: DcOrder status is "${dc.dcOrderId?.status}" but should be "dc_requested"!`);
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubmittedRequests();

