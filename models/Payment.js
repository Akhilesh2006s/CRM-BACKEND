const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
  },
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'NEFT/RTGS', 'Cheque', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Other'],
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Hold', 'Rejected'],
    default: 'Pending',
  },
  referenceNumber: {
    type: String,
  },
  refNo: {
    type: String,
  },
  description: {
    type: String,
  },
  receipt: {
    type: String,
  },
  // School/Customer information
  schoolCode: {
    type: String,
  },
  contactName: {
    type: String,
  },
  mobileNumber: {
    type: String,
  },
  location: {
    type: String,
  },
  town: {
    type: String,
  },
  zone: {
    type: String,
  },
  cluster: {
    type: String,
  },
  // Payment details
  financialYear: {
    type: String,
  },
  chqDate: {
    type: Date,
  },
  submissionNo: {
    type: String,
  },
  handoverRemarks: {
    type: String,
  },
  txnNo: {
    type: String,
  },
  // Payment mode specific fields
  upiId: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  chequeNumber: {
    type: String,
  },
  bankName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  },
  cardLast4: {
    type: String,
  },
  paymentGateway: {
    type: String,
  },
  otherDetails: {
    type: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  adminRemarks: {
    type: String,
  },
  heldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  heldAt: {
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

module.exports = mongoose.model('Payment', paymentSchema);

