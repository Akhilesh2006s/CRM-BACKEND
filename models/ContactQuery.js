const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema({
  school_code: {
    type: String,
    trim: true,
    index: true,
  },
  school_type: {
    type: String,
    enum: ['New', 'Existing'],
    default: 'Existing',
  },
  school_name: {
    type: String,
    required: true,
    trim: true,
  },
  zone: {
    type: String,
    trim: true,
    index: true,
  },
  executive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  town: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  contact_mobile: {
    type: String,
    trim: true,
  },
  enquiry_date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'In Progress'],
    default: 'Pending',
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolved_at: {
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

module.exports = mongoose.model('ContactQuery', contactQuerySchema);

