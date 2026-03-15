const safetyService = require('../services/safetyService');

exports.listActions = async (req, res) => {
  try {
    const { type } = req.query;
    if (!['block', 'mute'].includes(type)) {
      return res.status(400).json({ message: 'Invalid safety action type' });
    }

    const users = await safetyService.listActions(req.user.id, type);
    res.json(users);
  } catch (error) {
    console.error('listSafetyActions error:', error);
    res.status(500).json({ message: 'Failed to load safety actions' });
  }
};

exports.addAction = async (req, res) => {
  try {
    const { targetUserId, type } = req.body;
    if (!['block', 'mute'].includes(type)) {
      return res.status(400).json({ message: 'Invalid safety action type' });
    }

    await safetyService.addAction(req.user.id, targetUserId, type);
    res.json({ success: true });
  } catch (error) {
    console.error('addSafetyAction error:', error);
    res.status(400).json({ message: error.message || 'Failed to save safety action' });
  }
};

exports.removeAction = async (req, res) => {
  try {
    const { targetUserId, type } = req.params;
    if (!['block', 'mute'].includes(type)) {
      return res.status(400).json({ message: 'Invalid safety action type' });
    }

    await safetyService.removeAction(req.user.id, targetUserId, type);
    res.json({ success: true });
  } catch (error) {
    console.error('removeSafetyAction error:', error);
    res.status(500).json({ message: 'Failed to remove safety action' });
  }
};

exports.reportUser = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;
    await safetyService.reportUser(req.user.id, targetUserId, reason);
    res.json({ success: true });
  } catch (error) {
    console.error('reportUser error:', error);
    res.status(400).json({ message: error.message || 'Failed to submit report' });
  }
};
