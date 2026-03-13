const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, searchUsers, getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
