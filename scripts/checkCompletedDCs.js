const mongoose = require('mongoose');
require('dotenv').config();
const DC = require('../models/DC');
require('../models/User');

async function checkCompletedDCs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check DCs with status 'completed'
    console.log('📊 Checking DCs with status "completed"...');
    const completed = await DC.find({ status: 'completed' })
      .select('_id customerName status warehouseProcessedAt completedAt warehouseProcessedBy')
      .populate('warehouseProcessedBy', 'name')
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${completed.length} DCs with status 'completed':`);
    completed.forEach((dc, i) => {
      console.log(`\n${i + 1}. DC ID: ${dc._id}`);
      console.log(`   Customer: ${dc.customerName || 'N/A'}`);
      console.log(`   Status: ${dc.status}`);
      console.log(`   Processed By: ${dc.warehouseProcessedBy?.name || 'N/A'}`);
      console.log(`   Processed At: ${dc.warehouseProcessedAt ? new Date(dc.warehouseProcessedAt).toLocaleString() : 'N/A'}`);
      console.log(`   Completed At: ${dc.completedAt ? new Date(dc.completedAt).toLocaleString() : 'N/A'}`);
    });

    // Check DCs with status 'warehouse_processing'
    console.log('\n\n📊 Checking DCs with status "warehouse_processing"...');
    const processing = await DC.find({ status: 'warehouse_processing' })
      .select('_id customerName status')
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${processing.length} DCs with status 'warehouse_processing':`);
    processing.forEach((dc, i) => {
      console.log(`${i + 1}. ${dc.customerName || 'N/A'} - Status: ${dc.status}`);
    });

    // Check DCs with status 'pending_dc'
    console.log('\n\n📊 Checking DCs with status "pending_dc"...');
    const pending = await DC.find({ status: 'pending_dc' })
      .select('_id customerName status')
      .lean()
      .maxTimeMS(10000);
    
    console.log(`Found ${pending.length} DCs with status 'pending_dc':`);
    pending.forEach((dc, i) => {
      console.log(`${i + 1}. ${dc.customerName || 'N/A'} - Status: ${dc.status}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCompletedDCs();









