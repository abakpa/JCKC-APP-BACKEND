const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    unique: true,
    enum: ['Kingdom Choir', 'Kingdom Dancers']
  },
  description: {
    type: String,
    default: ''
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to get members count
groupSchema.virtual('membersCount', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'groups',
  count: true
});

groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
