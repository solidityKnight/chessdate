const { Op } = require('sequelize');
const { Message } = require('../models');
const followService = require('../services/followService');
const messageService = require('../services/messageService');
const safetyService = require('../services/safetyService');

const buildRoomId = (userId, friendId) =>
  [String(userId), String(friendId)].sort().join('_');

const emitConversationRefresh = async (io, userIds = []) => {
  const seenIds = new Set();

  for (const userId of userIds) {
    const normalizedId = String(userId || '');
    if (!normalizedId || seenIds.has(normalizedId)) continue;
    seenIds.add(normalizedId);

    await messageService.emitUnreadUpdate(io, normalizedId);
    messageService.emitInboxUpdate(io, normalizedId);
  }
};

function friendChatSocket(socket, io) {
  // Join a private chat room with a friend
  socket.on('join_friend_chat', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Please log in to use messages' });
        return;
      }

      const friendId = String(data?.friendId || '');
      const userId = String(socket.user.id);

      if (!friendId) {
        socket.emit('error', { message: 'Missing player to message' });
        return;
      }

      const canMessage = await followService.canUsersMessage(userId, friendId);

      if (!canMessage) {
        const blocked = await safetyService.areUsersBlocked(userId, friendId);
        socket.emit('error', {
          message: blocked
            ? 'This conversation is unavailable because one of you is blocked'
            : 'Follow this player to unlock messages',
        });
        return;
      }

      // Create a unique room ID for the two users
      const roomId = buildRoomId(userId, friendId);
      socket.join(roomId);

      await messageService.markConversationRead(userId, friendId);

      // Send chat history from DB
      const history = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
        order: [['createdAt', 'ASC']],
        limit: 50,
      });

      socket.emit('friend_chat_history', { friendId, history });
      await emitConversationRefresh(io, [userId]);
    } catch (error) {
      console.error('Error joining friend chat:', error);
      socket.emit('error', { message: 'Failed to join friend chat' });
    }
  });

  // Send a message to a friend
  socket.on('send_friend_message', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Please log in to use messages' });
        return;
      }

      const friendId = String(data?.friendId || '');
      const userId = String(socket.user.id);
      const trimmedContent = data?.content?.trim();

      if (!friendId || !trimmedContent) return;

      const canMessage = await followService.canUsersMessage(userId, friendId);

      if (!canMessage) {
        const blocked = await safetyService.areUsersBlocked(userId, friendId);
        socket.emit('error', {
          message: blocked
            ? 'This conversation is unavailable because one of you is blocked'
            : 'Follow this player to unlock messages',
        });
        return;
      }

      const roomId = buildRoomId(userId, friendId);
      const roomSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
      const recipientIsViewingConversation = Array.from(roomSockets).some((roomSocketId) => {
        const roomSocket = io.sockets.sockets.get(roomSocketId);
        return String(roomSocket?.user?.id || '') === friendId;
      });

      // Save to DB
      const message = await Message.create({
        senderId: userId,
        receiverId: friendId,
        content: trimmedContent,
        isRead: recipientIsViewingConversation,
      });

      // Emit to room
      io.to(roomId).emit('new_friend_message', message);
      await emitConversationRefresh(io, [userId, friendId]);
    } catch (error) {
      console.error('Error sending friend message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}

module.exports = friendChatSocket;
