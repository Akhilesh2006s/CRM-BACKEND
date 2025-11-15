const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  schoolCode: { type: String },
  schoolName: { type: String, required: true },
  zone: { type: String },
  town: { type: String },
  subject: { type: String, enum: ['Abacus', 'Vedic Maths', 'EEL', 'IIT', 'Financial literacy', 'Brain bytes', 'Spelling bee', 'Skill pro', 'Maths lab', 'Codechamp'], required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned executive
  serviceDate: { type: Date, required: true },
  term: { type: String }, // Term field (e.g., Term 1, Term 2, etc.)
  remarks: { type: String }, // Remarks field
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  poImageUrl: { type: String }, // Purchase Order image
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

serviceSchema.index({ schoolCode: 1 }, { sparse: true });
serviceSchema.index({ trainerId: 1 });
serviceSchema.index({ serviceDate: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ zone: 1 });

module.exports = mongoose.model('Service', serviceSchema);




