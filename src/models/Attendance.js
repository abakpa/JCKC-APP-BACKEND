const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  notes: {
    type: String,
    default: ''
  }
});

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  type: {
    type: String,
    enum: ['class', 'group'],
    required: true
  },
  // Reference to either Class or Group
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  records: [attendanceRecordSchema],
  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure either class or group is provided based on type
attendanceSchema.pre('save', function(next) {
  if (this.type === 'class' && !this.class) {
    return next(new Error('Class is required for class attendance'));
  }
  if (this.type === 'group' && !this.group) {
    return next(new Error('Group is required for group attendance'));
  }
  next();
});

// Index for faster queries
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ type: 1, class: 1 });
attendanceSchema.index({ type: 1, group: 1 });
attendanceSchema.index({ 'records.child': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
