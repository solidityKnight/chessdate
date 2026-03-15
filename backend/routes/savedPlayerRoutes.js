const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listSavedPlayers,
  savePlayer,
  removeSavedPlayer,
} = require('../controllers/savedPlayerController');

router.get('/', protect, listSavedPlayers);
router.post('/', protect, savePlayer);
router.delete('/', protect, removeSavedPlayer);

module.exports = router;
