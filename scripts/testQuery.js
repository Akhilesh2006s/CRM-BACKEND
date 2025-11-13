const mongoose = require('mongoose');
require('dotenv').config();
const DC = require('../models/DC');

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Simple count
    console.log('\n📊 Test 1: Count all DCs');
    const count = await DC.countDocuments({}).maxTimeMS(10000);
    console.log(`Total DCs: ${count}`);

    // Test 2: Get one DC without populate
    console.log('\n📊 Test 2: Get one DC (no populate)');
    const oneDC = await DC.findOne({}).select('_id employeeId dcOrderId customerName status').maxTimeMS(10000).lean();
    console.log('Sample DC:', oneDC);

    // Test 3: Get DCs for a specific employee (if we have one)
    if (oneDC && oneDC.employeeId) {
      console.log('\n📊 Test 3: Get DCs for employee (no populate)');
      const employeeDCs = await DC.find({ employeeId: oneDC.employeeId })
        .select('_id employeeId dcOrderId customerName status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .maxTimeMS(15000)
        .lean();
      console.log(`Found ${employeeDCs.length} DCs for employee ${oneDC.employeeId}`);
      employeeDCs.forEach((dc, idx) => {
        console.log(`  ${idx + 1}. ${dc.customerName || 'N/A'} - Status: ${dc.status}`);
      });
    }

    // Test 4: Check field names
    console.log('\n📊 Test 4: Check actual field names in database');
    const rawDC = await DC.collection.findOne({});
    console.log('Field names in raw document:', Object.keys(rawDC).filter(k => k.toLowerCase().includes('dcorder')));

    await mongoose.disconnect();
    console.log('\n✅ Tests complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testQuery();









