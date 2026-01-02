const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    enum: [
      'Nasareth Gem',
      'Holy Innocent Junior',
      'Holy Innocent Senior',
      'Future Glory Junior',
      'Future Glory Senior'
    ]
  },
  description: {
    type: String,
    default: ''
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ageRange: {
    min: Number,
    max: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to get children count
classSchema.virtual('childrenCount', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'class',
  count: true
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
