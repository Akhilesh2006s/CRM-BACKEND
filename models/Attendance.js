const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  attendanceReason: {
    type: String,
    enum: ['employee', 'collection', 'service', 'training', 'office', 'other'],
    required: true,
  },
  photo: {
    type: String, // URL or base64
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  pincode: {
    type: String,
    required: true,
  },
  town: {
    type: String,
    required: true,
  },
  isFirstTime: {
    type: Boolean,
    default: false,
  },
  remarks: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
attendanceSchema.index({ employeeId: 1, createdAt: -1 });
attendanceSchema.index({ startTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

