const Report = require('../models/Report');
const Sale = require('../models/Sale');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// @desc    Get all reports
// @route   GET /api/reports/all
// @access  Private
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales analytics
// @route   GET /api/reports/sales
// @access  Private
const getSalesReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter);

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    const salesByStatus = sales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSales,
      totalRevenue,
      averageSale,
      salesByStatus,
      sales,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate custom report
// @route   POST /api/reports/generate
// @access  Private
const generateReport = async (req, res) => {
  try {
    const { reportType, title, dateRange, filters } = req.body;

    let data = {};

    switch (reportType) {
      case 'Sales':
        const salesFilter = {};
        if (dateRange?.startDate) salesFilter.saleDate = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          salesFilter.saleDate = {
            ...salesFilter.saleDate,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.sales = await Sale.find(salesFilter);
        break;

      case 'Leads':
        data.leads = await Lead.find(filters || {});
        break;

      case 'Payments':
        const paymentFilter = {};
        if (dateRange?.startDate) paymentFilter.paymentDate = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          paymentFilter.paymentDate = {
            ...paymentFilter.paymentDate,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.payments = await Payment.find(paymentFilter);
        break;

      case 'Expenses':
        const expenseFilter = {};
        if (dateRange?.startDate) expenseFilter.date = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          expenseFilter.date = {
            ...expenseFilter.date,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.expenses = await Expense.find(expenseFilter);
        break;

      default:
        break;
    }

    const report = await Report.create({
      reportType,
      title,
      dateRange,
      filters,
      data,
      generatedBy: req.user._id,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllReports,
  getSalesReports,
  generateReport,
};

