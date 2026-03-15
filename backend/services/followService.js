const { Op } = require('sequelize');
const { Follow, User } = require('../models');
const safetyService = require('./safetyService');
const { publicUserAttributes } = require('../utils/userPresentation');

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

    if (await safetyService.areUsersBlocked(followerId, followingId)) {
      throw new Error('You cannot follow this player');
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
    if (await safetyService.areUsersBlocked(followerId, followingId)) {
      throw new Error('You cannot accept this follow request');
    }

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
    const blockedIds = await safetyService.getActionTargetIds(userId, 'block');

    if (type === 'followers') {
      const followers = await Follow.findAll({
        where: {
          followingId: userId,
          status: 'accepted',
          ...(blockedIds.length > 0 ? { followerId: { [Op.notIn]: blockedIds } } : {}),
        },
        include: [{ model: User, as: 'follower', attributes: publicUserAttributes }]
      });
      return followers.map(f => f.follower);
    } else if (type === 'following') {
      const following = await Follow.findAll({
        where: {
          followerId: userId,
          status: 'accepted',
          ...(blockedIds.length > 0 ? { followingId: { [Op.notIn]: blockedIds } } : {}),
        },
        include: [{ model: User, as: 'followed', attributes: publicUserAttributes }]
      });
      return following.map(f => f.followed);
    } else if (type === 'pending_followers') {
      const pendingFollowers = await Follow.findAll({
        where: {
          followingId: userId,
          status: 'pending',
          ...(blockedIds.length > 0 ? { followerId: { [Op.notIn]: blockedIds } } : {}),
        },
        include: [{ model: User, as: 'follower', attributes: publicUserAttributes }]
      });
      return pendingFollowers.map(f => f.follower);
    } else if (type === 'pending_following') {
      const pendingFollowing = await Follow.findAll({
        where: {
          followerId: userId,
          status: 'pending',
          ...(blockedIds.length > 0 ? { followingId: { [Op.notIn]: blockedIds } } : {}),
        },
        include: [{ model: User, as: 'followed', attributes: publicUserAttributes }]
      });
      return pendingFollowing.map(f => f.followed);
    }
    return [];
  }

  async canUsersMessage(userId, otherUserId) {
    if (!userId || !otherUserId) return false;
    if (await safetyService.areUsersBlocked(userId, otherUserId)) return false;

    const follow = await Follow.findOne({
      where: {
        [Op.or]: [
          { followerId: userId, followingId: otherUserId },
          { followerId: otherUserId, followingId: userId }
        ]
      }
    });

    return Boolean(follow);
  }

  async getConversationCandidates(userId) {
    const [followers, following, pendingFollowers, pendingFollowing] = await Promise.all([
      this.listFollows(userId, 'followers'),
      this.listFollows(userId, 'following'),
      this.listFollows(userId, 'pending_followers'),
      this.listFollows(userId, 'pending_following'),
    ]);

    const map = new Map();
    [...followers, ...following, ...pendingFollowers, ...pendingFollowing].forEach((user) => {
      if (user) {
        map.set(String(user.id), user);
      }
    });

    return Array.from(map.values());
  }

  async getMutualFollowIds(userId, targetIds = []) {
    if (!userId || targetIds.length === 0) return new Set();

    const [following, followers] = await Promise.all([
      Follow.findAll({
        where: {
          followerId: userId,
          followingId: targetIds,
          status: 'accepted',
        },
        attributes: ['followingId'],
      }),
      Follow.findAll({
        where: {
          followerId: targetIds,
          followingId: userId,
          status: 'accepted',
        },
        attributes: ['followerId'],
      }),
    ]);

    const followingIds = new Set(following.map((entry) => String(entry.followingId)));
    return new Set(
      followers
        .map((entry) => String(entry.followerId))
        .filter((targetId) => followingIds.has(targetId))
    );
  }
}

module.exports = new FollowService();
