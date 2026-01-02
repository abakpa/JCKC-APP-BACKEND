const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deactivateTeacher,
  getAllParents
} = require('../controllers/teacherController');

// Validation rules
const teacherValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.get('/parents', protect, authorize('teacher', 'admin'), getAllParents);

router.route('/')
  .get(protect, authorize('admin'), getAllTeachers)
  .post(protect, authorize('admin'), teacherValidation, createTeacher);

router.route('/:id')
  .get(protect, getTeacherById)
  .put(protect, authorize('admin'), updateTeacher)
  .delete(protect, authorize('admin'), deactivateTeacher);

module.exports = router;
