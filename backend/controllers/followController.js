const followService = require('../services/followService');

exports.requestFollow = async (req, res) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user.id;

    const follow = await followService.requestFollow(followerId, followingId);
    res.json({ message: 'Follow request sent', follow });
  } catch (error) {
    console.error('requestFollow error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.acceptFollow = async (req, res) => {
  try {
    const { followerId } = req.body;
    const followingId = req.user.id;

    const follow = await followService.acceptFollow(followerId, followingId);
    res.json({ message: 'Follow request accepted', follow });
  } catch (error) {
    console.error('acceptFollow error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.listFollows = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query; // 'followers', 'following', 'pending_followers', 'pending_following'

    const users = await followService.listFollows(userId, type);
    res.json(users);
  } catch (error) {
    console.error('listFollows error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
