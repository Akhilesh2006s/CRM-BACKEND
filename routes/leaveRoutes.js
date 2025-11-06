const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const { getLeaves, createLeave, approveLeave } = require('../controllers/leaveController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getLeaves);
router.post('/create', authMiddleware, createLeave);
router.put('/:id/approve', authMiddleware, approveLeave);

module.exports = router;

