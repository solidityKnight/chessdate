const { Op } = require('sequelize');
const { Follow, Message, User, UserReport, UserSafetyAction } = require('../models');
const { publicUserAttributes } = require('../utils/userPresentation');

class SafetyService {
  async addAction(userId, targetUserId, type) {
    if (!userId || !targetUserId) {
      throw new Error('Missing users for safety action');
    }
    if (userId === targetUserId) {
      throw new Error(`You cannot ${type} yourself`);
    }

    const [action] = await UserSafetyAction.findOrCreate({
      where: { userId, targetUserId, type },
      defaults: { userId, targetUserId, type },
    });

    if (type === 'block') {
      await Promise.all([
        Follow.destroy({
          where: {
            [Op.or]: [
              { followerId: userId, followingId: targetUserId },
              { followerId: targetUserId, followingId: userId },
            ],
          },
        }),
        Message.update(
          { isRead: true },
          {
            where: {
              senderId: targetUserId,
              receiverId: userId,
              isRead: false,
            },
          }
        ),
      ]);
    }

    return action;
  }

  async removeAction(userId, targetUserId, type) {
    await UserSafetyAction.destroy({
      where: { userId, targetUserId, type },
    });
  }

  async hasAction(userId, targetUserId, type) {
    if (!userId || !targetUserId) return false;
    const action = await UserSafetyAction.findOne({
      where: { userId, targetUserId, type },
    });
    return Boolean(action);
  }

  async areUsersBlocked(userId, otherUserId) {
    if (!userId || !otherUserId) return false;

    const action = await UserSafetyAction.findOne({
      where: {
        type: 'block',
        [Op.or]: [
          { userId, targetUserId: otherUserId },
          { userId: otherUserId, targetUserId: userId },
        ],
      },
    });

    return Boolean(action);
  }

  async getActionTargetIds(userId, type) {
    if (!userId) return [];
    const actions = await UserSafetyAction.findAll({
      where: { userId, type },
      attributes: ['targetUserId'],
    });
    return actions.map((action) => action.targetUserId);
  }

  async listActions(userId, type) {
    if (!userId) return [];
    const actions = await UserSafetyAction.findAll({
      where: { userId, type },
      include: [{ model: User, as: 'targetUser', attributes: publicUserAttributes }],
    });
    return actions.map((action) => action.targetUser);
  }

  async reportUser(reporterId, targetUserId, reason) {
    if (!reporterId || !targetUserId || !reason?.trim()) {
      throw new Error('Missing required report details');
    }
    if (reporterId === targetUserId) {
      throw new Error('You cannot report yourself');
    }

    return UserReport.create({
      reporterId,
      targetUserId,
      reason: reason.trim(),
    });
  }
}

module.exports = new SafetyService();
