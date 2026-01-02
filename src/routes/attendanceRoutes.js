const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  takeClassAttendance,
  takeGroupAttendance,
  updateAttendance,
  getAttendanceById,
  getClassAttendanceHistory,
  getGroupAttendanceHistory,
  getChildAttendanceHistory,
  getAttendanceReport
} = require('../controllers/attendanceController');

// Routes
router.post('/class', protect, authorize('teacher', 'admin'), takeClassAttendance);
router.post('/group', protect, authorize('teacher', 'admin'), takeGroupAttendance);
router.get('/report', protect, authorize('teacher', 'admin'), getAttendanceReport);
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getClassAttendanceHistory);
router.get('/group/:groupId', protect, authorize('teacher', 'admin'), getGroupAttendanceHistory);
router.get('/child/:childId', protect, getChildAttendanceHistory);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, authorize('teacher', 'admin'), updateAttendance);

module.exports = router;
