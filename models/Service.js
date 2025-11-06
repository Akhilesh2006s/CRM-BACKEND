const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  schoolCode: { type: String, required: true },
  schoolName: { type: String, required: true },
  zone: { type: String },
  town: { type: String },
  subject: { type: String, enum: ['Abacus', 'Vedic Maths', 'EELL'], required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned executive
  serviceDate: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  poImageUrl: { type: String }, // Purchase Order image
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

serviceSchema.index({ schoolCode: 1 });
serviceSchema.index({ trainerId: 1 });
serviceSchema.index({ serviceDate: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ zone: 1 });

module.exports = mongoose.model('Service', serviceSchema);




