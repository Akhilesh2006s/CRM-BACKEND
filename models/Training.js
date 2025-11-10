const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  schoolCode: { type: String, required: true },
  schoolName: { type: String, required: true },
  zone: { type: String },
  town: { type: String },
  subject: { type: String, enum: ['Abacus', 'Vedic Maths', 'EEL', 'IIT', 'Financial literacy', 'Brain bytes', 'Spelling bee', 'Skill pro', 'Maths lab', 'Codechamp'], required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned executive
  trainingDate: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  poImageUrl: { type: String }, // Purchase Order image
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

trainingSchema.index({ schoolCode: 1 });
trainingSchema.index({ trainerId: 1 });
trainingSchema.index({ trainingDate: 1 });
trainingSchema.index({ status: 1 });
trainingSchema.index({ zone: 1 });

module.exports = mongoose.model('Training', trainingSchema);

