const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getCurrentAttendance,
} = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/check-in', authMiddleware, checkIn);
router.post('/check-out', authMiddleware, checkOut);
router.get('/history', authMiddleware, getAttendanceHistory);
router.get('/current', authMiddleware, getCurrentAttendance);

module.exports = router;

