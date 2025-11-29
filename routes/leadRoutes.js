const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  exportLeads,
} = require('../controllers/leadController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getLeads);
router.get('/export', authMiddleware, exportLeads);
router.get('/:id', authMiddleware, getLead);
router.post('/', authMiddleware, createLead); // For mobile app compatibility
router.post('/create', authMiddleware, createLead);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);

module.exports = router;

