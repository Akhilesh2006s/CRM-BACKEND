const mongoose = require('mongoose');
require('dotenv').config();
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
require('../models/User');

async function fixDcStatusForClosedSales() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all DCs with status 'sent_to_manager' that have dcOrderId with status 'dc_requested'
    // These should stay in Closed Sales, not go to Pending DC
    console.log('📊 Finding DCs with status "sent_to_manager" that should stay in Closed Sales...');
    const dcs = await DC.find({ 
      status: 'sent_to_manager',
      dcOrderId: { $exists: true, $ne: null }
    })
      .select('_id dcOrderId customerName status poPhotoUrl')
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
      const dcOrderStatus = typeof dc.dcOrderId === 'object' ? dc.dcOrderId.status : null;

      // Only update if DcOrder status is 'dc_requested' (should stay in Closed Sales)
      if (dcOrderStatus !== 'dc_requested') {
        console.log(`⚠️  DcOrder ${dcOrderId} has status "${dcOrderStatus}", not "dc_requested", skipping`);
        skipped++;
        continue;
      }

      try {
        // Change DC status from 'sent_to_manager' to 'created' or 'po_submitted'
        const newStatus = dc.poPhotoUrl ? 'po_submitted' : 'created';
        await DC.findByIdAndUpdate(dc._id, { status: newStatus });
        console.log(`✅ Updated DC ${dc._id} (${dc.customerName || dc.dcOrderId?.school_name || 'N/A'}) from "sent_to_manager" to "${newStatus}"`);
        updated++;
      } catch (err) {
        console.error(`❌ Failed to update DC ${dc._id}:`, err.message);
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

fixDcStatusForClosedSales();









