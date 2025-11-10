const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

async function findBennett() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm-forge');
    console.log('Connected to database\n');

    // Find Bennett in DcOrders
    const bennettOrder = await DcOrder.findOne({ 
      school_name: { $regex: /bennett/i } 
    })
      .populate('assigned_to', 'name email')
      .lean();

    if (bennettOrder) {
      console.log('=== BENNETT DcOrder ===');
      console.log(`ID: ${bennettOrder._id}`);
      console.log(`School Name: ${bennettOrder.school_name}`);
      console.log(`Status: ${bennettOrder.status}`);
      console.log(`Assigned To: ${bennettOrder.assigned_to ? (typeof bennettOrder.assigned_to === 'object' ? bennettOrder.assigned_to.name : bennettOrder.assigned_to) : 'N/A'}`);
      console.log(`Created: ${bennettOrder.createdAt}`);
      console.log(`Updated: ${bennettOrder.updatedAt}`);
      console.log(`PO Proof URL: ${bennettOrder.pod_proof_url || 'N/A'}`);
      console.log(`Products: ${JSON.stringify(bennettOrder.products || [], null, 2)}`);

      // Check if there's a DC for this DcOrder
      const bennettDC = await DC.findOne({
        dcOrderId: bennettOrder._id
      })
        .populate('employeeId', 'name email')
        .populate('dcOrderId', 'school_name')
        .lean();

      if (bennettDC) {
        console.log('\n=== BENNETT DC ===');
        console.log(`DC ID: ${bennettDC._id}`);
        console.log(`Status: ${bennettDC.status}`);
        console.log(`Employee: ${bennettDC.employeeId ? (typeof bennettDC.employeeId === 'object' ? bennettDC.employeeId.name : bennettDC.employeeId) : 'N/A'}`);
        console.log(`Customer Name: ${bennettDC.customerName || 'N/A'}`);
        console.log(`Created: ${bennettDC.createdAt}`);
        console.log(`Updated: ${bennettDC.updatedAt}`);
        console.log(`PO Photo URL: ${bennettDC.poPhotoUrl || 'N/A'}`);
        console.log(`Product Details: ${JSON.stringify(bennettDC.productDetails || [], null, 2)}`);

        // Check if it should appear in "My Clients"
        const shouldAppear = bennettDC.status === 'created' || bennettDC.status === 'po_submitted';
        console.log(`\nShould appear in "My Clients"? ${shouldAppear ? 'YES' : 'NO'} (Status: ${bennettDC.status})`);
      } else {
        console.log('\n=== NO DC FOUND FOR BENNETT ===');
        console.log('Bennett exists as a DcOrder but has no corresponding DC.');
        console.log('It should appear in "My Clients" as a converted lead (status: created).');
      }
    } else {
      console.log('Bennett not found in DcOrders');
      
      // Check in DCs directly
      const bennettDC = await DC.findOne({
        customerName: { $regex: /bennett/i }
      })
        .populate('employeeId', 'name email')
        .populate('dcOrderId', 'school_name')
        .lean();

      if (bennettDC) {
        console.log('\n=== BENNETT DC (found directly) ===');
        console.log(`DC ID: ${bennettDC._id}`);
        console.log(`Status: ${bennettDC.status}`);
        console.log(`Employee: ${bennettDC.employeeId ? (typeof bennettDC.employeeId === 'object' ? bennettDC.employeeId.name : bennettDC.employeeId) : 'N/A'}`);
        console.log(`Customer Name: ${bennettDC.customerName || 'N/A'}`);
        console.log(`DC Order ID: ${bennettDC.dcOrderId ? (typeof bennettDC.dcOrderId === 'object' ? bennettDC.dcOrderId.school_name : bennettDC.dcOrderId) : 'N/A'}`);
        console.log(`Created: ${bennettDC.createdAt}`);
        console.log(`Updated: ${bennettDC.updatedAt}`);
        
        const shouldAppear = bennettDC.status === 'created' || bennettDC.status === 'po_submitted';
        console.log(`\nShould appear in "My Clients"? ${shouldAppear ? 'YES' : 'NO'} (Status: ${bennettDC.status})`);
      } else {
        console.log('Bennett not found in DCs either');
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findBennett();

