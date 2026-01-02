const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  assignTeacher,
  removeTeacher,
  addChildToGroup,
  removeChildFromGroup,
  initializeGroups
} = require('../controllers/groupController');

// Routes
router.post('/init', protect, authorize('admin'), initializeGroups);

router.route('/')
  .get(protect, getAllGroups)
  .post(protect, authorize('admin'), createGroup);

router.route('/:id')
  .get(protect, getGroupById)
  .put(protect, authorize('admin'), updateGroup);

router.post('/:id/assign-teacher', protect, authorize('admin'), assignTeacher);
router.post('/:id/remove-teacher', protect, authorize('admin'), removeTeacher);
router.post('/:id/add-child', protect, authorize('teacher', 'admin'), addChildToGroup);
router.post('/:id/remove-child', protect, authorize('teacher', 'admin'), removeChildFromGroup);

module.exports = router;
