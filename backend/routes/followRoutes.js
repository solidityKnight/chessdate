const express = require('express');
const router = express.Router();
const { requestFollow, acceptFollow, listFollows } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestFollow);
router.post('/accept', protect, acceptFollow);
router.get('/list', protect, listFollows);

module.exports = router;
