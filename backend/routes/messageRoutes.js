const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getInbox,
  getUnreadCount,
  markConversationRead,
} = require('../controllers/messageController');

router.get('/inbox', protect, getInbox);
router.get('/unread-count', protect, getUnreadCount);
router.post('/mark-read', protect, markConversationRead);

module.exports = router;
