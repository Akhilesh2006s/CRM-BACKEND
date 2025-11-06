const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ['Office Supplies', 'Travel', 'Marketing', 'Utilities', 'Salary', 'Rent', 'Other', 'Others', 'Food'],
    required: true,
  },
  expItemId: {
    type: String,
    // Expense item ID (like 95165, 95166)
  },
  gpsDistance: {
    type: Number,
    // GPS distance in kilometers
    default: 0,
  },
  employeeRemarks: {
    type: String,
    // Employee remarks/notes
  },
  managerRemarks: {
    type: String,
    // Manager remarks/notes
  },
  amount: {
    type: Number,
    required: true,
  },
  employeeAmount: {
    type: Number,
    // Original amount submitted by employee
  },
  approvedAmount: {
    type: Number,
    // Amount approved by manager
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Other'],
  },
  receipt: {
    type: String,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  department: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Manager Approved', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  pendingMonth: {
    type: String,
    // Format: "November", "October", etc.
  },
  managerApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Manager who approved the expense
  },
  managerApprovedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Finance manager who approved
  },
  approvedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', expenseSchema);

