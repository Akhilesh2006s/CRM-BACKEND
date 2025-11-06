const express = require('express');
const router = express.Router();
const {
  getSales,
  getSale,
  createSale,
  updateSale,
  submitPO,
  getClosedSales,
} = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getSales);
router.get('/closed', authMiddleware, getClosedSales);
router.get('/:id', authMiddleware, getSale);
router.post('/create', authMiddleware, createSale);
router.put('/:id', authMiddleware, updateSale);
router.post('/:id/submit-po', authMiddleware, submitPO);

module.exports = router;

