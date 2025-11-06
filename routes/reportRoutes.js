const express = require('express');
const router = express.Router();
const {
  getAllReports,
  getSalesReports,
  generateReport,
} = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/all', authMiddleware, getAllReports);
router.get('/sales', authMiddleware, getSalesReports);
router.post('/generate', authMiddleware, generateReport);

module.exports = router;

