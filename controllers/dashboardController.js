const mockDataService = require('../services/mockDataService');

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

module.exports = {
  getDashboardStats,
  getLeadsByZone,
  getRecentActivities
};


