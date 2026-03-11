const express = require('express');
const router = express.Router();
const { searchUsers, updateCredits, getStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/users/search', searchUsers);
router.post('/users/credits', updateCredits);
router.get('/stats', getStats);

module.exports = router;
