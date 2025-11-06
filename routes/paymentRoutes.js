const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  approvePayment,
  exportPayments,
} = require('../controllers/paymentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/export', authMiddleware, exportPayments);
router.get('/', authMiddleware, getPayments);
router.post('/create', authMiddleware, createPayment);
router.get('/:id', authMiddleware, getPayment);
router.put('/:id', authMiddleware, updatePayment);
router.put('/:id/approve', authMiddleware, roleMiddleware('Finance Manager', 'Admin', 'Super Admin'), approvePayment);

module.exports = router;

