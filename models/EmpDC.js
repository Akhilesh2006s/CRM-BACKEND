const mongoose = require('mongoose');

const empDcSchema = new mongoose.Schema(
  {
    emp_dc_code: { type: String, index: true },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kit_type: { type: String, enum: ['Sales', 'Training', 'Field'], required: true },
    distribution_date: { type: Date, required: true },
    expected_return_date: { type: Date },
    products: {
      type: [{ product: String, quantity: Number }],
      default: [],
    },
    status: { type: String, enum: ['active', 'used', 'returned', 'expired'], default: 'active' },
    employee_signature: { type: String },
    signature_date: { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

empDcSchema.pre('save', function (next) {
  if (!this.emp_dc_code) {
    this.emp_dc_code = `EMP-${Date.now().toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model('EmpDC', empDcSchema);






