const mockDataService = require('../services/mockDataService');
const Lead = require('../models/Lead');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
const Payment = require('../models/Payment');
const Training = require('../models/Training');
const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const stats = await mockDataService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leads by zone
// @route   GET /api/dashboard/leads-by-zone
// @access  Private
const getLeadsByZone = async (req, res) => {
  try {
    const zoneData = await mockDataService.getLeadsByZone();
    res.json(zoneData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
const getRecentActivities = async (req, res) => {
  try {
    const activities = [
      {
        id: '1',
        type: 'lead_created',
        message: 'New lead ABC School created',
        timestamp: new Date(),
        user: 'Pavan Simhadri'
      },
      {
        id: '2',
        type: 'training_completed',
        message: 'Digital Marketing Training completed',
        timestamp: new Date(Date.now() - 3600000),
        user: 'John Doe'
      },
      {
        id: '3',
        type: 'sale_made',
        message: 'Sale of ₹50,000 completed',
        timestamp: new Date(Date.now() - 7200000),
        user: 'Pavan Simhadri'
      }
    ];
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue trends
// @route   GET /api/dashboard/revenue-trends
// @access  Private
const getRevenueTrends = async (req, res) => {
  try {
    // Get last 7 days of data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get leads created on this day
      const leadsCount = await Lead.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      // Get sales (DCs) created on this day
      const salesCount = await DC.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      // Get revenue from payments on this day
      const payments = await Payment.find({
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'Approved'
      });
      const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      trends.push({
        name: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        leads: leadsCount,
        sales: salesCount,
        revenue: revenue
      });
    }
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leads volume by hour
// @route   GET /api/dashboard/leads-volume
// @access  Private
const getLeadsVolume = async (req, res) => {
  try {
    const volume = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get leads created today and group by hour
    const leads = await Lead.find({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Initialize all hours with 0
    for (let hour = 1; hour <= 24; hour++) {
      volume.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value: 0 });
    }
    
    // Count leads by hour
    leads.forEach(lead => {
      const hour = new Date(lead.createdAt).getHours() + 1;
      if (hour >= 1 && hour <= 24) {
        volume[hour - 1].value++;
      }
    });
    
    res.json(volume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get alerts
// @route   GET /api/dashboard/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for hot leads that need follow-up today
    const hotLeadsPending = await Lead.countDocuments({
      priority: 'Hot',
      follow_up_date: { $lte: today },
      status: { $in: ['Pending', 'Processing'] }
    });
    
    if (hotLeadsPending > 0) {
      alerts.push({
        level: 'warning',
        text: `Follow-up pending for ${hotLeadsPending} hot lead${hotLeadsPending > 1 ? 's' : ''} today`
      });
    }
    
    // Check for trainings scheduled this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const trainingsThisWeek = await Training.countDocuments({
      startDate: { $gte: today, $lte: weekFromNow }
    });
    
    if (trainingsThisWeek > 0) {
      alerts.push({
        level: 'info',
        text: `${trainingsThisWeek} training${trainingsThisWeek > 1 ? 's' : ''} scheduled this week`
      });
    }
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get zone-wise leads analytics
// @route   GET /api/dashboard/leads-analytics/zone-wise
// @access  Private
const getZoneWiseLeads = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = { status: { $in: ['Pending', 'Processing'] } };
    
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    const leads = await Lead.find(filter);
    const zoneData = {};
    
    leads.forEach(lead => {
      const zone = lead.zone || 'Unknown';
      if (!zoneData[zone]) {
        zoneData[zone] = {
          zone: zone,
          total: 0,
          hot: 0,
          warm: 0,
          cold: 0
        };
      }
      zoneData[zone].total++;
      const priority = lead.priority || 'Cold';
      if (priority === 'Hot') zoneData[zone].hot++;
      else if (priority === 'Warm') zoneData[zone].warm++;
      else zoneData[zone].cold++;
    });
    
    res.json(Object.values(zoneData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get executive-wise leads analytics
// @route   GET /api/dashboard/leads-analytics/executive-wise
// @access  Private
const getExecutiveWiseLeads = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = { status: { $in: ['Pending', 'Processing'] } };
    
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    const leads = await Lead.find(filter).populate('managed_by', 'name');
    const executiveData = {};
    
    leads.forEach(lead => {
      const executiveId = lead.managed_by?._id?.toString() || 'unassigned';
      const executiveName = lead.managed_by?.name || 'Unassigned';
      const zone = lead.zone || 'Unknown';
      
      const key = `${executiveId}_${zone}`;
      if (!executiveData[key]) {
        executiveData[key] = {
          zone: zone,
          executiveName: executiveName,
          total: 0,
          hot: 0,
          warm: 0,
          cold: 0
        };
      }
      executiveData[key].total++;
      const priority = lead.priority || 'Cold';
      if (priority === 'Hot') executiveData[key].hot++;
      else if (priority === 'Warm') executiveData[key].warm++;
      else executiveData[key].cold++;
    });
    
    res.json(Object.values(executiveData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get zone-wise closed leads analytics
// @route   GET /api/dashboard/leads-analytics/zone-wise-closed
// @access  Private
const getZoneWiseClosedLeads = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = { status: { $in: ['Closed', 'Saved'] } };
    
    if (fromDate && toDate) {
      filter.updatedAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    const leads = await Lead.find(filter);
    const zoneData = {};
    
    leads.forEach(lead => {
      const zone = lead.zone || 'Unknown';
      if (!zoneData[zone]) {
        zoneData[zone] = {
          zone: zone,
          totalClosed: 0
        };
      }
      zoneData[zone].totalClosed++;
    });
    
    res.json(Object.values(zoneData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get executive-wise closed leads analytics
// @route   GET /api/dashboard/leads-analytics/executive-wise-closed
// @access  Private
const getExecutiveWiseClosedLeads = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = { status: { $in: ['Closed', 'Saved'] } };
    
    if (fromDate && toDate) {
      filter.updatedAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    const leads = await Lead.find(filter).populate('managed_by', 'name');
    const executiveData = {};
    
    leads.forEach(lead => {
      const executiveId = lead.managed_by?._id?.toString() || 'unassigned';
      const executiveName = lead.managed_by?.name || 'Unassigned';
      const zone = lead.zone || 'Unknown';
      
      const key = `${executiveId}_${zone}`;
      if (!executiveData[key]) {
        executiveData[key] = {
          zone: zone,
          executiveName: executiveName,
          totalClosed: 0
        };
      }
      executiveData[key].totalClosed++;
    });
    
    res.json(Object.values(executiveData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getLeadsByZone,
  getRecentActivities,
  getRevenueTrends,
  getLeadsVolume,
  getAlerts,
  getZoneWiseLeads,
  getExecutiveWiseLeads,
  getZoneWiseClosedLeads,
  getExecutiveWiseClosedLeads
};


