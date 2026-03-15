const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listActions,
  addAction,
  removeAction,
  reportUser,
} = require('../controllers/safetyController');

router.get('/list', protect, listActions);
router.post('/action', protect, addAction);
router.delete('/action/:type/:targetUserId', protect, removeAction);
router.post('/report', protect, reportUser);

module.exports = router;
