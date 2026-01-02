const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .populate('teachers', 'firstName lastName email');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teachers', 'firstName lastName email phoneNumber');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Private (Admin)
const createSession = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingSession = await Session.findOne({ name });
    if (existingSession) {
      return res.status(400).json({ message: 'Session already exists' });
    }

    const newSession = await Session.create({
      name,
      description
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Admin)
const updateSession = async (req, res) => {
  try {
    const { description } = req.body;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { description },
      { new: true, runValidators: true }
    ).populate('teachers', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign teacher to session
// @route   POST /api/sessions/:id/assign-teacher
// @access  Private (Admin)
const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const sessionId = req.params.id;

    // Verify teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    // Add teacher to session
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { $addToSet: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add session to teacher's assigned sessions
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedSessions: sessionId }
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove teacher from session
// @route   POST /api/sessions/:id/remove-teacher
// @access  Private (Admin)
const removeTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const sessionId = req.params.id;

    // Remove teacher from session
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { $pull: { teachers: teacherId } },
      { new: true }
    ).populate('teachers', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Remove session from teacher's assigned sessions
    await User.findByIdAndUpdate(teacherId, {
      $pull: { assignedSessions: sessionId }
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Initialize default sessions
// @route   POST /api/sessions/init
// @access  Private (Admin)
const initializeSessions = async (req, res) => {
  try {
    const defaultSessions = [
      { name: 'Technical Team', description: 'Technical Team Session' },
      { name: 'Welfare Team', description: 'Welfare Team Session' }
    ];

    const createdSessions = [];

    for (const sessionData of defaultSessions) {
      const existing = await Session.findOne({ name: sessionData.name });
      if (!existing) {
        const newSession = await Session.create(sessionData);
        createdSessions.push(newSession);
      }
    }

    res.status(201).json({
      message: 'Sessions initialized',
      created: createdSessions.length,
      sessions: createdSessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  assignTeacher,
  removeTeacher,
  initializeSessions
};
