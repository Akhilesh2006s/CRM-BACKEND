const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeadsByZone,
  getRecentActivities
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, getDashboardStats);
router.get('/leads-by-zone', authMiddleware, getLeadsByZone);
router.get('/recent-activities', authMiddleware, getRecentActivities);

module.exports = router;


