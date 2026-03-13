const { Follow, User } = require('../models');

class FollowService {
  /**
   * Send follow request
   * @param {string} followerId - ID of follower
   * @param {string} followingId - ID of following
   * @returns {Object} Follow request object
   */
  async requestFollow(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself');
    }

    // Check if follow already exists
    const existingFollow = await Follow.findOne({
      where: { followerId, followingId }
    });

    if (existingFollow) {
      throw new Error('Follow already exists');
    }

    const follow = await Follow.create({
      followerId,
      followingId,
      status: 'pending'
    });

    return follow;
  }

  /**
   * Accept follow request
   * @param {string} followerId - ID of follower
   * @param {string} followingId - ID of following (the one being followed)
   * @returns {Object} Updated follow object
   */
  async acceptFollow(followerId, followingId) {
    const follow = await Follow.findOne({
      where: { followerId, followingId, status: 'pending' }
    });

    if (!follow) {
      throw new Error('Follow request not found');
    }

    follow.status = 'accepted';
    await follow.save();

    return follow;
  }

  /**
   * List follow relationships for user
   * @param {string} userId - ID of user
   * @param {string} type - 'followers' or 'following'
   * @returns {Array} List of users
   */
  async listFollows(userId, type) {
    if (type === 'followers') {
      const followers = await Follow.findAll({
        where: { followingId: userId, status: 'accepted' },
        include: [{ model: User, as: 'follower' }]
      });
      return followers.map(f => f.follower);
    } else if (type === 'following') {
      const following = await Follow.findAll({
        where: { followerId: userId, status: 'accepted' },
        include: [{ model: User, as: 'followed' }]
      });
      return following.map(f => f.followed);
    } else if (type === 'pending_followers') {
      const pendingFollowers = await Follow.findAll({
        where: { followingId: userId, status: 'pending' },
        include: [{ model: User, as: 'follower' }]
      });
      return pendingFollowers.map(f => f.follower);
    }
    return [];
  }
}

module.exports = new FollowService();
