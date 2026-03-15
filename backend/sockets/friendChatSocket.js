const { Op } = require('sequelize');
const { Message } = require('../models');
const followService = require('../services/followService');

function friendChatSocket(socket, io) {
  // Join a private chat room with a friend
  socket.on('join_friend_chat', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Please log in to use messages' });
        return;
      }

      const { friendId } = data;
      const userId = socket.user.id;

      const canMessage = await followService.canUsersMessage(userId, friendId);

      if (!canMessage) {
        socket.emit('error', { message: 'Follow this player to unlock messages' });
        return;
      }

      // Create a unique room ID for the two users
      const roomId = [userId, friendId].sort().join('_');
      socket.join(roomId);

      // Send chat history from DB
      const history = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId }
          ]
        },
        order: [['createdAt', 'ASC']],
        limit: 50
      });

      socket.emit('friend_chat_history', { friendId, history });
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

      const { friendId, content } = data;
      const userId = socket.user.id;
      const trimmedContent = content?.trim();

      if (!trimmedContent) return;

      const canMessage = await followService.canUsersMessage(userId, friendId);

      if (!canMessage) {
        socket.emit('error', { message: 'Follow this player to unlock messages' });
        return;
      }

      // Save to DB
      const message = await Message.create({
        senderId: userId,
        receiverId: friendId,
        content: trimmedContent
      });

      // Emit to room
      const roomId = [userId, friendId].sort().join('_');
      io.to(roomId).emit('new_friend_message', message);

      // Also emit a notification to the friend if they are not in the room
      // (Optional: Implement notification logic)
    } catch (error) {
      console.error('Error sending friend message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}

module.exports = friendChatSocket;
