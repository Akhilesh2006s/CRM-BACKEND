const express = require('express');
const router = express.Router();
const { getTownFromPincode } = require('../controllers/locationController');

router.get('/get-town', getTownFromPincode);

module.exports = router;

