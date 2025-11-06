const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['Sales', 'Leads', 'Employees', 'Training', 'Payments', 'Expenses', 'Warehouse', 'Custom'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  dateRange: {
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  format: {
    type: String,
    enum: ['PDF', 'Excel', 'JSON'],
    default: 'JSON',
  },
  fileUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);

