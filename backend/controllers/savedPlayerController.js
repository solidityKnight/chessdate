const savedPlayerService = require('../services/savedPlayerService');
const safetyService = require('../services/safetyService');

exports.listSavedPlayers = async (req, res) => {
  try {
    const { kind } = req.query;
    const savedPlayers = await savedPlayerService.list(req.user.id, kind);
    res.json(savedPlayers);
  } catch (error) {
    console.error('listSavedPlayers error:', error);
    res.status(500).json({ message: 'Failed to load saved players' });
  }
};

exports.savePlayer = async (req, res) => {
  try {
    const { targetUserId, kind, sourceGameId } = req.body;
    if (!['favorite', 'rematch_later'].includes(kind)) {
      return res.status(400).json({ message: 'Invalid save type' });
    }
    if (await safetyService.areUsersBlocked(req.user.id, targetUserId)) {
      return res.status(400).json({ message: 'You cannot save this player' });
    }

    await savedPlayerService.save(req.user.id, targetUserId, kind, sourceGameId);
    res.json({ success: true });
  } catch (error) {
    console.error('savePlayer error:', error);
    res.status(400).json({ message: error.message || 'Failed to save player' });
  }
};

exports.removeSavedPlayer = async (req, res) => {
  try {
    const { targetUserId, kind } = req.body;
    await savedPlayerService.remove(req.user.id, targetUserId, kind);
    res.json({ success: true });
  } catch (error) {
    console.error('removeSavedPlayer error:', error);
    res.status(500).json({ message: 'Failed to remove saved player' });
  }
};
