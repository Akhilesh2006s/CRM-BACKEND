const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createExecutiveReturn,
  listExecutiveReturns,
  listMyExecutiveReturns,
  createWarehouseReturn,
  listWarehouseReturns,
} = require('../controllers/stockReturnController');

router.post('/executive', authMiddleware, createExecutiveReturn);
router.get('/executive', authMiddleware, listExecutiveReturns);
router.get('/executive/mine', authMiddleware, listMyExecutiveReturns);

router.post('/warehouse', authMiddleware, createWarehouseReturn);
router.get('/warehouse', authMiddleware, listWarehouseReturns);

module.exports = router;


