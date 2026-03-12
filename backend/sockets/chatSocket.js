const gameManager = require('../services/gameManager');
const botService  = require('../services/BotService');

function chatSocket(socket, io) {
  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { gameId, message } = data;

      // Validate message
      if (!message || message.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (message.length > 500) {
        socket.emit('error', { message: 'Message too long (max 500 characters)' });
        return;
      }

      // Validate that player is in this game
      const playerColor = gameManager.getPlayerColor(gameId, socket.id);
      if (!playerColor) {
        socket.emit('error', { message: 'You are not in this game' });
        return;
      }

      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'You must be logged in to chat' });
        return;
      }

      // Add message to game chat
      const chatMessage = await gameManager.addChatMessage(gameId, socket.user.id, message.trim());

      // Broadcast message to all players in the game room
      io.to(gameId).emit('chat_message', {
        playerId: socket.user.id,
        playerColor,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp
      });

      // If this is a bot game, route the message to the bot chat system
      if (botService.isBotGame(gameId)) {
        botService.onPlayerChat(gameId, io, chatMessage.message);
      }

    } catch (error) {
      console.error('Error sending chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle request for chat history
  socket.on('get_chat_history', async (data) => {
    try {
      const { gameId } = data;

      // Force Redis read for full chat history
      const gameState = await gameManager.getGameState(gameId, true);
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Validate that player is in this game
      const playerColor = gameManager.getPlayerColor(gameId, socket.id);
      if (!playerColor) {
        socket.emit('error', { message: 'You are not in this game' });
        return;
      }

      socket.emit('chat_history', {
        messages: (gameState.chatMessages || []).map((m) => ({
          playerId: m.playerId,
          playerColor:
            gameState.userIds?.white && m.playerId === gameState.userIds.white
              ? 'white'
              : gameState.userIds?.black && m.playerId === gameState.userIds.black
                ? 'black'
                : playerColor,
          message: m.message,
          timestamp: m.timestamp
        }))
      });

    } catch (error) {
      console.error('Error getting chat history:', error);
      socket.emit('error', { message: 'Failed to get chat history' });
    }
  });

  // Handle typing indicators (optional feature)
  socket.on('typing_start', (data) => {
    const { gameId } = data;
    const playerColor = gameManager.getPlayerColor(gameId, socket.id);

    if (playerColor) {
      socket.to(gameId).emit('player_typing', {
        playerColor,
        isTyping: true
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { gameId } = data;
    const playerColor = gameManager.getPlayerColor(gameId, socket.id);

    if (playerColor) {
      socket.to(gameId).emit('player_typing', {
        playerColor,
        isTyping: false
      });
    }
  });
}

module.exports = chatSocket;
