const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');

console.log('Script starting...');
dotenv.config();
console.log('Environment loaded');

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
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

const checkConvertedLeads = async () => {
  try {
    console.log('\n🔍 Checking for converted leads (clients)...\n');

    // 1. Find all DcOrders with status 'saved' (these are converted leads)
    const savedDcOrders = await DcOrder.find({ status: 'saved' })
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .sort({ updatedAt: -1 })
      .maxTimeMS(20000) // 20 second timeout
      .lean()
      .catch(err => {
        if (err.message && (err.message.includes('timeout') || err.message.includes('connection'))) {
          console.warn('⚠️  Query timeout - returning empty array');
          return [];
        }
        throw err;
      });

    console.log(`📊 Total DcOrders with status 'saved' (converted leads): ${savedDcOrders.length}\n`);

    if (savedDcOrders.length === 0) {
      console.log('❌ No converted leads found. All leads are still pending or in other statuses.\n');
      return;
    }

    // 2. Check which ones have DCs created
    const dcOrderIds = savedDcOrders.map(order => order._id);
    const dcs = await DC.find({ dcOrderId: { $in: dcOrderIds } })
      .populate('employeeId', 'name email')
      .maxTimeMS(20000) // 20 second timeout
      .lean()
      .catch(err => {
        if (err.message && (err.message.includes('timeout') || err.message.includes('connection'))) {
          console.warn('⚠️  Query timeout - returning empty array');
          return [];
        }
        throw err;
      });

    console.log(`📦 Total DCs created from converted leads: ${dcs.length}\n`);

    // 3. Group by whether they have DCs or not
    const withDC = [];
    const withoutDC = [];

    savedDcOrders.forEach(order => {
      const hasDC = dcs.some(dc => {
        const dcOrderId = dc.dcOrderId 
          ? (typeof dc.dcOrderId === 'object' ? dc.dcOrderId._id.toString() : dc.dcOrderId.toString())
          : null;
        return dcOrderId === order._id.toString();
      });

      if (hasDC) {
        const dc = dcs.find(dc => {
          const dcOrderId = dc.dcOrderId 
            ? (typeof dc.dcOrderId === 'object' ? dc.dcOrderId._id.toString() : dc.dcOrderId.toString())
            : null;
          return dcOrderId === order._id.toString();
        });
        withDC.push({ order, dc });
      } else {
        withoutDC.push(order);
      }
    });

    console.log(`✅ Converted leads WITH DC created: ${withDC.length}`);
    console.log(`⚠️  Converted leads WITHOUT DC created: ${withoutDC.length}\n`);

    // 4. Display details
    if (withDC.length > 0) {
      console.log('\n📋 CONVERTED LEADS WITH DC (Full Clients):');
      console.log('='.repeat(80));
      withDC.forEach(({ order, dc }, index) => {
        console.log(`\n${index + 1}. School: ${order.school_name || 'N/A'}`);
        console.log(`   DcOrder ID: ${order._id}`);
        console.log(`   DC ID: ${dc._id}`);
        console.log(`   Status: DcOrder=${order.status}, DC=${dc.status}`);
        console.log(`   Assigned To: ${order.assigned_to?.name || 'N/A'}`);
        console.log(`   Employee (DC): ${dc.employeeId?.name || 'N/A'}`);
        console.log(`   Contact: ${order.contact_mobile || 'N/A'}`);
        console.log(`   Zone: ${order.zone || 'N/A'}`);
        console.log(`   Created: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`);
        console.log(`   Updated: ${order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}`);
      });
    }

    if (withoutDC.length > 0) {
      console.log('\n\n⚠️  CONVERTED LEADS WITHOUT DC (Should appear in "My Clients" as virtual clients):');
      console.log('='.repeat(80));
      withoutDC.forEach((order, index) => {
        console.log(`\n${index + 1}. School: ${order.school_name || 'N/A'}`);
        console.log(`   DcOrder ID: ${order._id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Assigned To: ${order.assigned_to?.name || 'N/A'}`);
        console.log(`   Contact: ${order.contact_mobile || 'N/A'}`);
        console.log(`   Zone: ${order.zone || 'N/A'}`);
        console.log(`   Created: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`);
        console.log(`   Updated: ${order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}`);
        console.log(`   ⚠️  Note: This should appear in "My Clients" page as a virtual client`);
      });
    }

    // 5. Summary by employee
    console.log('\n\n📊 SUMMARY BY EMPLOYEE:');
    console.log('='.repeat(80));
    const employeeStats = {};
    
    savedDcOrders.forEach(order => {
      const employeeId = order.assigned_to 
        ? (typeof order.assigned_to === 'object' ? order.assigned_to._id.toString() : order.assigned_to.toString())
        : 'unassigned';
      const employeeName = order.assigned_to?.name || 'Unassigned';
      
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          name: employeeName,
          total: 0,
          withDC: 0,
          withoutDC: 0
        };
      }
      
      employeeStats[employeeId].total++;
      
      const hasDC = dcs.some(dc => {
        const dcOrderId = dc.dcOrderId 
          ? (typeof dc.dcOrderId === 'object' ? dc.dcOrderId._id.toString() : dc.dcOrderId.toString())
          : null;
        return dcOrderId === order._id.toString();
      });
      
      if (hasDC) {
        employeeStats[employeeId].withDC++;
      } else {
        employeeStats[employeeId].withoutDC++;
      }
    });

    Object.values(employeeStats).forEach(stat => {
      console.log(`\n👤 ${stat.name}:`);
      console.log(`   Total converted leads: ${stat.total}`);
      console.log(`   With DC: ${stat.withDC}`);
      console.log(`   Without DC (virtual): ${stat.withoutDC}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('❌ Error checking converted leads:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the check
const run = async () => {
  const connected = await connectDB();
  if (connected) {
    await checkConvertedLeads();
  } else {
    console.error('Failed to connect to database');
    process.exit(1);
  }
};

run();

