const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
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
} = require('../controllers/childController');

// Validation rules
const childValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('class').notEmpty().withMessage('Class is required')
];

// Routes
router.get('/search', protect, searchChild);
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getChildrenByClass);
router.get('/group/:groupId', protect, authorize('teacher', 'admin'), getChildrenByGroup);

router.route('/')
  .get(protect, authorize('teacher', 'admin'), getAllChildren)
  .post(protect, childValidation, registerChild);

router.route('/:id')
  .get(protect, getChildById)
  .put(protect, updateChild)
  .delete(protect, authorize('admin'), deleteChild);

router.post('/:id/photo', protect, upload.single('photo'), uploadPhoto);
router.put('/:id/transfer-class', protect, authorize('teacher', 'admin'), transferClass);
router.put('/:id/join-group', protect, authorize('teacher', 'admin'), joinGroup);
router.put('/:id/leave-group', protect, authorize('teacher', 'admin'), leaveGroup);

module.exports = router;
