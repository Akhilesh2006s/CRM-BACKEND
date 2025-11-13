const mongoose = require('mongoose');

const sampleRequestSchema = new mongoose.Schema(
  {
    request_code: {
      type: String,
      unique: true,
      index: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    products: [{
      product_name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
    purpose: {
      type: String,
      default: 'To show schools',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    accepted_at: {
      type: Date,
    },
    rejected_at: {
      type: Date,
    },
    accepted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejection_reason: {
      type: String,
      trim: true,
    },
    // When accepted, create an EmpDC entry
    emp_dc_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmpDC',
    },
  },
  { timestamps: true }
);

// Generate request code before saving
sampleRequestSchema.pre('save', async function(next) {
  if (!this.request_code) {
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      code = `SAMPLE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const existing = await mongoose.model('SampleRequest').findOne({ request_code: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return next(new Error('Failed to generate unique request code'));
    }
    
    this.request_code = code;
  }
  next();
});

module.exports = mongoose.model('SampleRequest', sampleRequestSchema);

