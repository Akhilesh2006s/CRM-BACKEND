const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getEmployeeLeaves,
  resetEmployeePassword,
  getEmployeeTracking,
  exportEmployeeTracking,
} = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getEmployees);
router.get('/tracking', authMiddleware, getEmployeeTracking);
router.get('/tracking/export', authMiddleware, exportEmployeeTracking);
router.get('/:id', authMiddleware, getEmployee);
router.get('/:id/leaves', authMiddleware, getEmployeeLeaves);
router.post('/create', authMiddleware, createEmployee);
router.put('/:id', authMiddleware, updateEmployee);
router.put('/:id/reset-password', authMiddleware, resetEmployeePassword);

module.exports = router;

