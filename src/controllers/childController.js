const Child = require('../models/Child');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Register a new child
// @route   POST /api/children
// @access  Private (Parent/Admin)
const registerChild = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, dateOfBirth, gender, class: classId, groups, allergies, medicalNotes, emergencyContact, parent } = req.body;

    // Determine parent ID
    let parentId;
    if (req.user.role === 'parent') {
      parentId = req.user._id;
    } else {
      // Admin or teacher must provide a parent
      parentId = parent;
      if (!parentId) {
        return res.status(400).json({ message: 'Please select a parent for the child' });
      }
    }

    const child = await Child.create({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      class: classId,
      groups: groups || [],
      parent: parentId,
      allergies,
      medicalNotes,
      emergencyContact
    });

    // Add child to parent's children array
    await User.findByIdAndUpdate(parentId, {
      $push: { children: child._id }
    });

    const populatedChild = await Child.findById(child._id)
      .populate('class')
      .populate('groups')
      .populate('parent', 'firstName lastName phoneNumber');

    res.status(201).json(populatedChild);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all children
// @route   GET /api/children
// @access  Private (Teacher/Admin)
const getAllChildren = async (req, res) => {
  try {
    const { classId, groupId, search, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };

    if (classId) {
      query.class = classId;
    }

    if (groupId) {
      query.groups = groupId;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } }
      ];
    }

    const children = await Child.find(query)
      .populate('class', 'name')
      .populate('groups', 'name')
      .populate('parent', 'firstName lastName phoneNumber')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Child.countDocuments(query);

    res.json({
      children,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get child by ID
// @route   GET /api/children/:id
// @access  Private
const getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('class')
      .populate('groups')
      .populate('parent', 'firstName lastName phoneNumber email');

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    res.json(child);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search child by unique ID or parent phone
// @route   GET /api/children/search
// @access  Private
const searchChild = async (req, res) => {
  try {
    const { uniqueId, phone } = req.query;

    let child;

    if (uniqueId) {
      child = await Child.findOne({ uniqueId, isActive: true })
        .populate('class')
        .populate('groups')
        .populate('parent', 'firstName lastName phoneNumber');
    } else if (phone) {
      const parent = await User.findOne({ phoneNumber: phone });
      if (parent) {
        child = await Child.find({ parent: parent._id, isActive: true })
          .populate('class')
          .populate('groups')
          .populate('parent', 'firstName lastName phoneNumber');
      }
    }

    if (!child || (Array.isArray(child) && child.length === 0)) {
      return res.status(404).json({ message: 'No child found' });
    }

    res.json(child);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update child
// @route   PUT /api/children/:id
// @access  Private (Parent of child/Admin)
const updateChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Check ownership (parent can only update their own children)
    if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this child' });
    }

    const allowedUpdates = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'class', 'groups', 'allergies', 'medicalNotes', 'emergencyContact'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        child[field] = req.body[field];
      }
    });

    await child.save();

    const updatedChild = await Child.findById(child._id)
      .populate('class')
      .populate('groups')
      .populate('parent', 'firstName lastName phoneNumber');

    res.json(updatedChild);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload child photo
// @route   POST /api/children/:id/photo
// @access  Private
const uploadPhoto = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a photo' });
    }

    child.photo = `/uploads/${req.file.filename}`;
    await child.save();

    res.json({ photo: child.photo, message: 'Photo uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get children by class
// @route   GET /api/children/class/:classId
// @access  Private (Teacher/Admin)
const getChildrenByClass = async (req, res) => {
  try {
    const children = await Child.find({ class: req.params.classId, isActive: true })
      .populate('parent', 'firstName lastName phoneNumber')
      .sort({ firstName: 1 });

    res.json(children);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get children by group
// @route   GET /api/children/group/:groupId
// @access  Private (Teacher/Admin)
const getChildrenByGroup = async (req, res) => {
  try {
    const children = await Child.find({ groups: req.params.groupId, isActive: true })
      .populate('class', 'name')
      .populate('parent', 'firstName lastName phoneNumber')
      .sort({ firstName: 1 });

    res.json(children);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete child (soft delete)
// @route   DELETE /api/children/:id
// @access  Private (Admin)
const deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    child.isActive = false;
    await child.save();

    res.json({ message: 'Child deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Transfer child to another class
// @route   PUT /api/children/:id/transfer-class
// @access  Private (Teacher/Admin)
const transferClass = async (req, res) => {
  try {
    const { newClassId } = req.body;

    if (!newClassId) {
      return res.status(400).json({ message: 'New class ID is required' });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    const oldClassId = child.class;
    child.class = newClassId;
    await child.save();

    const updatedChild = await Child.findById(child._id)
      .populate('class', 'name')
      .populate('groups', 'name')
      .populate('parent', 'firstName lastName phoneNumber');

    res.json({
      message: 'Child transferred to new class successfully',
      child: updatedChild,
      previousClass: oldClassId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add child to a group
// @route   PUT /api/children/:id/join-group
// @access  Private (Teacher/Admin)
const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Check if already in the group
    if (child.groups.includes(groupId)) {
      return res.status(400).json({ message: 'Child is already in this group' });
    }

    child.groups.push(groupId);
    await child.save();

    const updatedChild = await Child.findById(child._id)
      .populate('class', 'name')
      .populate('groups', 'name')
      .populate('parent', 'firstName lastName phoneNumber');

    res.json({
      message: 'Child added to group successfully',
      child: updatedChild
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove child from a group
// @route   PUT /api/children/:id/leave-group
// @access  Private (Teacher/Admin)
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Check if in the group
    if (!child.groups.includes(groupId)) {
      return res.status(400).json({ message: 'Child is not in this group' });
    }

    child.groups = child.groups.filter(g => g.toString() !== groupId);
    await child.save();

    const updatedChild = await Child.findById(child._id)
      .populate('class', 'name')
      .populate('groups', 'name')
      .populate('parent', 'firstName lastName phoneNumber');

    res.json({
      message: 'Child removed from group successfully',
      child: updatedChild
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerChild,
  getAllChildren,
  getChildById,
  searchChild,
  updateChild,
  uploadPhoto,
  getChildrenByClass,
  getChildrenByGroup,
  deleteChild,
  transferClass,
  joinGroup,
  leaveGroup
};
