const User = require('../models/User');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true })
      .populate('assignedClasses', 'name')
      .populate('assignedGroups', 'name')
      .populate('assignedSessions', 'name')
      .select('-password');

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .populate('assignedClasses', 'name')
      .populate('assignedGroups', 'name')
      .populate('assignedSessions', 'name')
      .select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create teacher (Admin)
// @route   POST /api/teachers
// @access  Private (Admin)
const createTeacher = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or phone number' });
    }

    const teacher = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role: 'teacher'
    });

    res.status(201).json({
      _id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      role: teacher.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
const updateTeacher = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      { firstName, lastName, phoneNumber },
      { new: true, runValidators: true }
    )
      .populate('assignedClasses', 'name')
      .populate('assignedGroups', 'name')
      .populate('assignedSessions', 'name')
      .select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Deactivate teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
const deactivateTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      { isActive: false },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all parents
// @route   GET /api/teachers/parents
// @access  Private (Admin/Teacher)
const getAllParents = async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent', isActive: true })
      .populate('children', 'firstName lastName uniqueId')
      .select('-password');

    res.json(parents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deactivateTeacher,
  getAllParents
};
