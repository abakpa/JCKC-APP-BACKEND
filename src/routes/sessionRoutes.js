const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  assignTeacher,
  removeTeacher,
  initializeSessions
} = require('../controllers/sessionController');

// Routes
router.post('/init', protect, authorize('admin'), initializeSessions);

router.route('/')
  .get(protect, getAllSessions)
  .post(protect, authorize('admin'), createSession);

router.route('/:id')
  .get(protect, getSessionById)
  .put(protect, authorize('admin'), updateSession);

router.post('/:id/assign-teacher', protect, authorize('admin'), assignTeacher);
router.post('/:id/remove-teacher', protect, authorize('admin'), removeTeacher);

module.exports = router;
