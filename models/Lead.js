const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    // Core school/deal info
    school_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      required: true,
      trim: true,
    },
    contact_mobile: {
      type: String,
      required: true,
      trim: true,
    },
    products: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },

    // Assignment
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Deal Conversion status
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Saved', 'Closed'],
      default: 'Pending',
      index: true,
    },

    // Business metadata
    school_code: {
      type: String,
      unique: false,
      sparse: true,
      trim: true,
    },
    po_number: {
      type: String,
      trim: true,
    },
    follow_up_date: {
      type: Date,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      default: 'Cold',
      index: true,
    },
    zone: {
      type: String,
      default: '',
      trim: true,
    },
    strength: {
      // student count
      type: Number,
      default: 0,
      min: 0,
    },

    // Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managed_by: {
      // current executive handling the deal
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', leadSchema);

