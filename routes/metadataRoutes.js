const express = require('express');
const router = express.Router();
const { getInventoryOptions } = require('../controllers/metadataController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/inventory-options', authMiddleware, getInventoryOptions);

module.exports = router;

