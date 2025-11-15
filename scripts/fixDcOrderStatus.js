const mongoose = require('mongoose');
require('dotenv').config();
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
require('../models/User');

async function fixDcOrderStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all DCs with status 'sent_to_manager' that have dcOrderId
    console.log('📊 Finding DCs with status "sent_to_manager"...');
    const dcs = await DC.find({ 
      status: 'sent_to_manager',
      dcOrderId: { $exists: true, $ne: null }
    })
      .select('_id dcOrderId customerName status')
      .populate('dcOrderId', 'school_name status')
      .lean()
      .maxTimeMS(10000);

    console.log(`Found ${dcs.length} DCs with status 'sent_to_manager'\n`);

    let updated = 0;
    let skipped = 0;

    for (const dc of dcs) {
      if (!dc.dcOrderId) {
        console.log(`⚠️  DC ${dc._id} has no dcOrderId, skipping`);
        skipped++;
        continue;
      }

      const dcOrderId = typeof dc.dcOrderId === 'object' ? dc.dcOrderId._id : dc.dcOrderId;
      const currentStatus = typeof dc.dcOrderId === 'object' ? dc.dcOrderId.status : null;

      if (currentStatus === 'dc_requested') {
        console.log(`✓ DcOrder ${dcOrderId} already has status 'dc_requested', skipping`);
        skipped++;
        continue;
      }

      try {
        await DcOrder.findByIdAndUpdate(dcOrderId, { status: 'dc_requested' });
        console.log(`✅ Updated DcOrder ${dcOrderId} (${dc.customerName || dc.dcOrderId?.school_name || 'N/A'}) from "${currentStatus}" to "dc_requested"`);
        updated++;
      } catch (err) {
        console.error(`❌ Failed to update DcOrder ${dcOrderId}:`, err.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${dcs.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDcOrderStatus();











