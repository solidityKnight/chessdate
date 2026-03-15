const { Op } = require('sequelize');
const { Message, User } = require('../models');
const followService = require('./followService');
const presenceService = require('./presenceService');
const safetyService = require('./safetyService');
const savedPlayerService = require('./savedPlayerService');
const { publicUserAttributes } = require('../utils/userPresentation');

class MessageService {
  async getConversationUserIds(userId) {
    const [followCandidates, messageRows, savedPlayers] = await Promise.all([
      followService.getConversationCandidates(userId),
      Message.findAll({
        where: {
          [Op.or]: [{ senderId: userId }, { receiverId: userId }],
        },
        attributes: ['senderId', 'receiverId'],
      }),
      savedPlayerService.list(userId),
    ]);

    const ids = new Set(
      followCandidates.map((user) => String(user.id))
    );

    messageRows.forEach((row) => {
      const otherId = String(row.senderId) === String(userId) ? row.receiverId : row.senderId;
      if (otherId && String(otherId) !== String(userId)) {
        ids.add(String(otherId));
      }
    });

    savedPlayers.forEach((entry) => {
      if (entry.targetUser?.id) {
        ids.add(String(entry.targetUser.id));
      }
    });

    return Array.from(ids);
  }

  async getUnreadCount(userId) {
    const mutedIds = await safetyService.getActionTargetIds(userId, 'mute');

    return Message.count({
      where: {
        receiverId: userId,
        isRead: false,
        ...(mutedIds.length > 0 ? { senderId: { [Op.notIn]: mutedIds } } : {}),
      },
    });
  }

  async markConversationRead(userId, friendId) {
    await Message.update(
      { isRead: true },
      {
        where: {
          receiverId: userId,
          senderId: friendId,
          isRead: false,
        },
      }
    );
  }

  async getConversationSummaries(userId) {
    const candidateIds = await this.getConversationUserIds(userId);
    if (candidateIds.length === 0) return [];

    const [users, mutedIds, blockedIds, savedKindsMap] = await Promise.all([
      User.findAll({
        where: { id: candidateIds },
        attributes: publicUserAttributes,
      }),
      safetyService.getActionTargetIds(userId, 'mute'),
      safetyService.getActionTargetIds(userId, 'block'),
      savedPlayerService.getKindsMap(userId, candidateIds),
    ]);

    const mutedSet = new Set(mutedIds.map(String));
    const blockedSet = new Set(blockedIds.map(String));

    const summaries = await Promise.all(
      users.map(async (user) => {
        const friendId = String(user.id);
        const [lastMessage, unreadCount, canMessage, blockedByThem] = await Promise.all([
          Message.findOne({
            where: {
              [Op.or]: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId },
              ],
            },
            order: [['createdAt', 'DESC']],
          }),
          Message.count({
            where: {
              senderId: friendId,
              receiverId: userId,
              isRead: false,
            },
          }),
          followService.canUsersMessage(userId, friendId),
          safetyService.hasAction(friendId, userId, 'block'),
        ]);

        const savedKinds = Array.from(savedKindsMap.get(friendId) || []);

        return {
          user: {
            ...user.toJSON(),
            isOnline: presenceService.isUserOnline(friendId),
          },
          lastMessagePreview: lastMessage?.content || '',
          lastMessageAt: lastMessage?.createdAt || null,
          lastMessageFromMe: lastMessage ? String(lastMessage.senderId) === String(userId) : false,
          unreadCount: mutedSet.has(friendId) ? 0 : unreadCount,
          muted: mutedSet.has(friendId),
          blocked: blockedSet.has(friendId),
          blockedByThem,
          canMessage,
          savedKinds,
        };
      })
    );

    return summaries.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }

  async emitUnreadUpdate(io, userId) {
    if (!io || !userId) return;
    const unreadCount = await this.getUnreadCount(userId);
    presenceService.getSocketIds(userId).forEach((socketId) => {
      io.to(socketId).emit('friend_unread_updated', { unreadCount });
    });
  }

  emitInboxUpdate(io, userId) {
    if (!io || !userId) return;
    presenceService.getSocketIds(userId).forEach((socketId) => {
      io.to(socketId).emit('friend_inbox_updated', { userId: String(userId) });
    });
  }
}

module.exports = new MessageService();
