const express = require('express');
const router = express.Router();
const { getSchools } = require('../controllers/schoolController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getSchools);

module.exports = router;

