const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  assignTeacher,
  removeTeacher,
  initializeClasses
} = require('../controllers/classController');

// Routes
router.post('/init', protect, authorize('admin'), initializeClasses);

router.route('/')
  .get(protect, getAllClasses)
  .post(protect, authorize('admin'), createClass);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, authorize('admin'), updateClass);

router.post('/:id/assign-teacher', protect, authorize('admin'), assignTeacher);
router.post('/:id/remove-teacher', protect, authorize('admin'), removeTeacher);

module.exports = router;
