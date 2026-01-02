const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate('teachers', 'firstName lastName email')
      .populate('childrenCount');

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teachers', 'firstName lastName email phoneNumber');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin)
const createClass = async (req, res) => {
  try {
    const { name, description, ageRange } = req.body;

    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists' });
    }

    const newClass = await Class.create({
      name,
      description,
      ageRange
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin)
const updateClass = async (req, res) => {
  try {
    const { description, ageRange } = req.body;

    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      { description, ageRange },
      { new: true, runValidators: true }
    ).populate('teachers', 'firstName lastName email');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign teacher to class
// @route   POST /api/classes/:id/assign-teacher
// @access  Private (Admin)
const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classId = req.params.id;

    // Verify teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    // Add teacher to class
    const classItem = await Class.findByIdAndUpdate(
      classId,
      { $addToSet: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Add class to teacher's assigned classes
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedClasses: classId }
    });

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove teacher from class
// @route   POST /api/classes/:id/remove-teacher
// @access  Private (Admin)
const removeTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classId = req.params.id;

    // Remove teacher from class
    const classItem = await Class.findByIdAndUpdate(
      classId,
      { $pull: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove class from teacher's assigned classes
    await User.findByIdAndUpdate(teacherId, {
      $pull: { assignedClasses: classId }
    });

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Initialize default classes
// @route   POST /api/classes/init
// @access  Private (Admin)
const initializeClasses = async (req, res) => {
  try {
    const defaultClasses = [
      { name: 'Nasareth Gem', description: 'Nasareth Gem Class' },
      { name: 'Holy Innocent Junior', description: 'Holy Innocent Junior Class' },
      { name: 'Holy Innocent Senior', description: 'Holy Innocent Senior Class' },
      { name: 'Future Glory Junior', description: 'Future Glory Junior Class' },
      { name: 'Future Glory Senior', description: 'Future Glory Senior Class' }
    ];

    const createdClasses = [];

    for (const classData of defaultClasses) {
      const existing = await Class.findOne({ name: classData.name });
      if (!existing) {
        const newClass = await Class.create(classData);
        createdClasses.push(newClass);
      }
    }

    res.status(201).json({
      message: 'Classes initialized',
      created: createdClasses.length,
      classes: createdClasses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  assignTeacher,
  removeTeacher,
  initializeClasses
};
