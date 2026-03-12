const express = require('express');
const router = express.Router();
const { searchUsers, listUsers, updateCredits, getStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

// User management
router.get('/users', listUsers);
router.get('/users/search', searchUsers);
router.post('/users/credits', updateCredits);

// Stats
router.get('/stats', getStats);

module.exports = router;
