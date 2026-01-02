const Group = require('../models/Group');
const User = require('../models/User');
const Child = require('../models/Child');

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isActive: true })
      .populate('teachers', 'firstName lastName email')
      .populate('membersCount');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('teachers', 'firstName lastName email phoneNumber');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private (Admin)
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group already exists' });
    }

    const newGroup = await Group.create({
      name,
      description
    });

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (Admin)
const updateGroup = async (req, res) => {
  try {
    const { description } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { description },
      { new: true, runValidators: true }
    ).populate('teachers', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign teacher to group
// @route   POST /api/groups/:id/assign-teacher
// @access  Private (Admin)
const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const groupId = req.params.id;

    // Verify teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    // Add teacher to group
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Add group to teacher's assigned groups
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedGroups: groupId }
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove teacher from group
// @route   POST /api/groups/:id/remove-teacher
// @access  Private (Admin)
const removeTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const groupId = req.params.id;

    // Remove teacher from group
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove group from teacher's assigned groups
    await User.findByIdAndUpdate(teacherId, {
      $pull: { assignedGroups: groupId }
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add child to group
// @route   POST /api/groups/:id/add-child
// @access  Private (Admin/Teacher)
const addChildToGroup = async (req, res) => {
  try {
    const { childId } = req.body;
    const groupId = req.params.id;

    const child = await Child.findByIdAndUpdate(
      childId,
      { $addToSet: { groups: groupId } },
      { new: true }
    ).populate('groups', 'name');

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    res.json({ message: 'Child added to group', child });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove child from group
// @route   POST /api/groups/:id/remove-child
// @access  Private (Admin/Teacher)
const removeChildFromGroup = async (req, res) => {
  try {
    const { childId } = req.body;
    const groupId = req.params.id;

    const child = await Child.findByIdAndUpdate(
      childId,
      { $pull: { groups: groupId } },
      { new: true }
    ).populate('groups', 'name');

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    res.json({ message: 'Child removed from group', child });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Initialize default groups
// @route   POST /api/groups/init
// @access  Private (Admin)
const initializeGroups = async (req, res) => {
  try {
    const defaultGroups = [
      { name: 'Kingdom Choir', description: 'Kingdom Choir Group' },
      { name: 'Kingdom Dancers', description: 'Kingdom Dancers Group' }
    ];

    const createdGroups = [];

    for (const groupData of defaultGroups) {
      const existing = await Group.findOne({ name: groupData.name });
      if (!existing) {
        const newGroup = await Group.create(groupData);
        createdGroups.push(newGroup);
      }
    }

    res.status(201).json({
      message: 'Groups initialized',
      created: createdGroups.length,
      groups: createdGroups
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  assignTeacher,
  removeTeacher,
  addChildToGroup,
  removeChildFromGroup,
  initializeGroups
};
