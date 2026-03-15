const messageService = require('../services/messageService');

exports.getInbox = async (req, res) => {
  try {
    const summaries = await messageService.getConversationSummaries(req.user.id);
    res.json(summaries);
  } catch (error) {
    console.error('getInbox error:', error);
    res.status(500).json({ message: 'Failed to load inbox' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await messageService.getUnreadCount(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ message: 'Failed to load unread count' });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { friendId } = req.body;
    await messageService.markConversationRead(req.user.id, friendId);
    const unreadCount = await messageService.getUnreadCount(req.user.id);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('markConversationRead error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};
