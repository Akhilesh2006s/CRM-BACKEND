const express = require('express');
const router = express.Router();
const {
  getContactQueries,
  getContactQuery,
  createContactQuery,
  updateContactQuery,
  deleteContactQuery,
  exportContactQueries,
} = require('../controllers/contactQueryController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getContactQueries);
router.get('/export', authMiddleware, exportContactQueries);
router.get('/:id', authMiddleware, getContactQuery);
router.post('/create', authMiddleware, createContactQuery);
router.put('/:id', authMiddleware, updateContactQuery);
router.delete('/:id', authMiddleware, deleteContactQuery);

module.exports = router;

