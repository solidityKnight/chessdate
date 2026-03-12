const express = require('express');
const router = express.Router();
const { searchUsers, listUsers, updateCredits, getStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const settingsService = require('../services/SettingsService');

router.use(protect);
router.use(admin);

// User management
router.get('/users', listUsers);
router.get('/users/search', searchUsers);
router.post('/users/credits', updateCredits);

// Stats
router.get('/stats', getStats);

// ─── AI Bot Toggle ────────────────────────────────────────────────────────────

router.get('/settings/ai-bots', async (req, res) => {
  try {
    res.json({ enabled: settingsService.areBotsEnabled() });
  } catch (err) {
    console.error('Get AI bots setting error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings/ai-bots', async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }

    await settingsService.set('AI_BOTS_ENABLED', String(enabled));
    res.json({ enabled: settingsService.areBotsEnabled(), message: `AI Bots ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    console.error('Update AI bots setting error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

