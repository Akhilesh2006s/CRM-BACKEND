const express = require('express');
const router = express.Router();
const { getInventoryOptions, getStates, getCities } = require('../controllers/metadataController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/inventory-options', authMiddleware, getInventoryOptions);
router.get('/states', authMiddleware, getStates);
router.get('/cities', authMiddleware, getCities);

module.exports = router;

