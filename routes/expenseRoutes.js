const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpense,
  createExpense,
  approveExpense,
  getManagerPendingExpenses,
  getFinancePendingExpenses,
  getExpensesByEmployee,
  approveMultipleExpenses,
  getExpensesReport,
  exportExpenses,
  updateExpense,
} = require('../controllers/expenseController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Specific routes must come before parameterized routes
router.get('/', authMiddleware, getExpenses);
router.get('/manager-pending', authMiddleware, getManagerPendingExpenses);
router.get('/finance-pending', authMiddleware, getFinancePendingExpenses);
router.get('/report', authMiddleware, getExpensesReport);
router.get('/export', authMiddleware, exportExpenses);
router.get('/employee/:employeeId', authMiddleware, getExpensesByEmployee);
router.post('/create', authMiddleware, createExpense);
router.post('/approve-multiple', authMiddleware, approveMultipleExpenses);
router.put('/:id/approve', authMiddleware, approveExpense);
// Parameterized routes must come last
router.get('/:id', authMiddleware, getExpense);
router.put('/:id', authMiddleware, updateExpense);

module.exports = router;

