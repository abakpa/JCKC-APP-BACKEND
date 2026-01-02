const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  photo: {
    type: String,
    default: null
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent is required']
  },
  // Additional info
  allergies: {
    type: String,
    default: ''
  },
  medicalNotes: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique ID before saving
childSchema.pre('save', async function(next) {
  if (!this.uniqueId) {
    const count = await mongoose.model('Child').countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.uniqueId = `JCKC${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Get full name
childSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Calculate age
childSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

// Index for search
childSchema.index({ uniqueId: 1 });
childSchema.index({ 'parent': 1 });

module.exports = mongoose.model('Child', childSchema);
