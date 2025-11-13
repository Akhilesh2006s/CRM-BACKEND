const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExcelJS = require('exceljs');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { status, category, startDate, endDate, my } = req.query;
    const filter = {};

    // If my=true, filter by current user's created expenses only
    // This ensures employees only see expenses they themselves created/submitted
    if (my === 'true') {
      filter.createdBy = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('managerApprovedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }

    const expense = await Expense.findById(id)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('managerApprovedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create expense
// @route   POST /api/expenses/create
// @access  Private
const createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // If user is an employee, automatically set employeeId to their ID
    if (req.user.role === 'Executive' && !req.body.employeeId) {
      expenseData.employeeId = req.user._id;
    }

    const expense = await Expense.create(expenseData);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get manager pending expenses
// @route   GET /api/expenses/manager-pending
// @access  Private
const getManagerPendingExpenses = async (req, res) => {
  try {
    const { employeeId, trainerId } = req.query;
    const filter = {
      status: 'Pending',
    };

    if (employeeId) filter.employeeId = employeeId;
    if (trainerId) filter.trainerId = trainerId;

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expenses by employee for manager update
// @route   GET /api/expenses/employee/:employeeId
// @access  Private
const getExpensesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { fromDate, toDate } = req.query;
    
    const filter = {
      $or: [
        { employeeId: employeeId },
        { trainerId: employeeId }
      ],
      status: 'Pending',
    };

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve multiple expenses (manager approval)
// @route   POST /api/expenses/approve-multiple
// @access  Private
const approveMultipleExpenses = async (req, res) => {
  try {
    const { expenses } = req.body; // Array of { id, approvedAmount, managerRemarks }

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'Expenses array is required' });
    }

    const updatedExpenses = [];

    for (const exp of expenses) {
      const { id, approvedAmount, managerRemarks } = exp;
      
      const updateData = {
        status: 'Manager Approved',
        managerApprovedBy: req.user._id,
        managerApprovedAt: new Date(),
      };

      if (approvedAmount !== undefined && approvedAmount !== null) {
        updateData.approvedAmount = approvedAmount;
      } else {
        // If no approved amount specified, use original amount
        const expense = await Expense.findById(id);
        if (expense) {
          updateData.approvedAmount = expense.amount;
          if (!expense.employeeAmount) {
            updateData.employeeAmount = expense.amount;
          }
        }
      }

      if (managerRemarks) {
        updateData.managerRemarks = managerRemarks;
      }

      const updated = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate('employeeId', 'name email')
        .populate('trainerId', 'name email')
        .populate('managerApprovedBy', 'name email');

      if (updated) {
        updatedExpenses.push(updated);
      }
    }

    res.json({ 
      message: `${updatedExpenses.length} expense(s) approved successfully`,
      expenses: updatedExpenses 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get finance pending expenses
// @route   GET /api/expenses/finance-pending
// @access  Private
const getFinancePendingExpenses = async (req, res) => {
  try {
    const { employeeId, trainerId } = req.query;
    const filter = {
      status: 'Manager Approved',
    };

    if (employeeId && employeeId !== 'all') {
      filter.employeeId = employeeId;
    }
    if (trainerId && trainerId !== 'all') {
      filter.trainerId = trainerId;
    }

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('managerApprovedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Ensure all expenses have the required fields with defaults
    const formattedExpenses = expenses.map(expense => {
      const expenseObj = expense.toObject ? expense.toObject() : expense;
      return {
        ...expenseObj,
        employeeAmount: expenseObj.employeeAmount || expenseObj.amount || 0,
        approvedAmount: expenseObj.approvedAmount || expenseObj.amount || 0,
      };
    });

    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching finance pending expenses:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch finance pending expenses',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private
const approveExpense = async (req, res) => {
  try {
    const { status, rejectionReason, approvedAmount } = req.body;

    const updateData = {
      status,
    };

    if (status === 'Manager Approved') {
      // Manager approval
      updateData.managerApprovedBy = req.user._id;
      updateData.managerApprovedAt = new Date();
      if (approvedAmount !== undefined) {
        updateData.approvedAmount = approvedAmount;
      }
      // Set employeeAmount if not already set
      const expense = await Expense.findById(req.params.id);
      if (expense && !expense.employeeAmount) {
        updateData.employeeAmount = expense.amount;
      }
    } else if (status === 'Approved') {
      // Finance approval
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('managerApprovedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expenses report
// @route   GET /api/expenses/report
// @access  Private
const getExpensesReport = async (req, res) => {
  try {
    const { zone, employeeId, status, fromDate, toDate } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (employeeId && employeeId !== 'all') {
      filter.$or = [
        { employeeId: employeeId },
        { trainerId: employeeId }
      ];
    }

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    let expenses = await Expense.find(filter)
      .populate('employeeId', 'name email zone')
      .populate('trainerId', 'name email zone')
      .populate('managerApprovedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Filter by zone if provided (check populated fields)
    if (zone && zone !== 'all') {
      expenses = expenses.filter(exp => {
        const empZone = exp.employeeId?.zone || exp.trainerId?.zone || '';
        return empZone.toLowerCase().includes(zone.toLowerCase());
      });
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export expenses to Excel
// @route   GET /api/expenses/export
// @access  Private
const exportExpenses = async (req, res) => {
  try {
    const { zone, employeeId, status, fromDate, toDate } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (employeeId && employeeId !== 'all') {
      filter.$or = [
        { employeeId: employeeId },
        { trainerId: employeeId }
      ];
    }

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    let expenses = await Expense.find(filter)
      .populate('employeeId', 'name email zone')
      .populate('trainerId', 'name email zone')
      .populate('managerApprovedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Filter by zone if provided
    if (zone && zone !== 'all') {
      expenses = expenses.filter(exp => {
        const empZone = exp.employeeId?.zone || exp.trainerId?.zone || '';
        return empZone.toLowerCase().includes(zone.toLowerCase());
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses Report');

    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Exp No', key: 'expNo', width: 12 },
      { header: 'Created On', key: 'createdOn', width: 20 },
      { header: 'Exp Date', key: 'expDate', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Approved Manager', key: 'approvedManager', width: 25 },
      { header: 'Approved Fin', key: 'approvedFin', width: 20 },
      { header: 'Expense Amount', key: 'expenseAmount', width: 15 },
      { header: 'Approved Amount', key: 'approvedAmount', width: 15 },
      { header: 'Approved Remarks', key: 'approvedRemarks', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    expenses.forEach((expense, index) => {
      const employeeName = expense.employeeId?.name || expense.trainerId?.name || '';
      const approvedManager = expense.managerApprovedBy?.name || '';
      const approvedFin = expense.approvedBy?.name || 'Vishwam Edutech';
      const status = expense.status === 'Pending' ? 'Pending at Manager' : 
                     expense.status === 'Manager Approved' ? 'Pending at Finance' :
                     expense.status;

      worksheet.addRow({
        sno: index + 1,
        expNo: expense.expItemId || expense._id.toString().slice(-5),
        createdOn: new Date(expense.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        expDate: new Date(expense.date).toISOString().split('T')[0],
        employeeName: employeeName,
        approvedManager: approvedManager,
        approvedFin: approvedFin,
        expenseAmount: expense.employeeAmount || expense.amount || 0,
        approvedAmount: expense.approvedAmount || 0,
        approvedRemarks: expense.managerRemarks || '',
        status: status,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('managerApprovedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

