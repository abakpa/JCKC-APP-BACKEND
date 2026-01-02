const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendBulkNotifications
} = require('../controllers/notificationController');

// Routes
router.route('/')
  .get(protect, getNotifications)
  .post(protect, authorize('teacher', 'admin'), sendNotification);

router.post('/bulk', protect, authorize('teacher', 'admin'), sendBulkNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
