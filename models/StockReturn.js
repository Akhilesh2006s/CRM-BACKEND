const mongoose = require('mongoose');

const stockReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: Number, required: true },
    returnDate: { type: Date, required: true },
    sourceType: { type: String, enum: ['Executive', 'Warehouse'], required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

    remarks: { type: String, default: '', trim: true },
    lrNumber: { type: String, default: '', trim: true },
    finYear: { type: String, default: '', trim: true },
    schoolType: { type: String, default: '', trim: true },
    schoolCode: { type: String, default: '', trim: true },

    lineItems: [
      {
        itemName: { type: String, trim: true },
        quantity: { type: Number, default: 0, min: 0 },
        reason: { type: String, trim: true, default: '' },
      },
    ],

    status: { type: String, enum: ['Submitted', 'Reviewed', 'Rejected'], default: 'Submitted' },
  },
  { timestamps: true }
);

stockReturnSchema.index({ createdBy: 1, returnNumber: 1 }, { unique: false });

module.exports = mongoose.model('StockReturn', stockReturnSchema);


