'use strict';

const matchmakingService = require('../services/matchmakingService');
const gameManager        = require('../services/gameManager');
const aiService          = require('../services/aiService');
const creditSystem       = require('../utils/creditSystem');
const botService         = require('../services/BotService');

function matchmakingSocket(socket, io) {

  socket.on('select_gender', async (data) => {
    try {
      const { gender } = data;

      if (!socket.user) {
        socket.emit('error', { message: 'Please sign in to play' });
        return;
      }

      // Regenerate credits before checking
      await creditSystem.regenerateCredits(socket.user);

      if (!creditSystem.canPlay(socket.user)) {
        socket.emit('error', { 
          message: 'You have run out of credits.' 
        });
        return;
      }

      if (!['male', 'female'].includes(gender)) {
        socket.emit('error', { message: 'Invalid gender selection' });
        return;
      }

      console.log(`Player ${socket.id} selected gender: ${gender}`);

      const match = await matchmakingService.addToQueue(socket.id, gender, {
        userId: socket.user.id,
        eloRating: data.eloRating,
        latitude: data.latitude,
        longitude: data.longitude,
        preferredDistance: data.preferredDistance
      });

      if (match) {
        // Real match found — cancel any pending bot fallback for BOTH players
        botService.cancelFallbackTimer(match.players.white.socketId);
        botService.cancelFallbackTimer(match.players.black.socketId);

        const gameState = await gameManager.createGame(match.gameId, match.players);
        const pickUpLine = await aiService.generateChessPickUpLine();

        const whiteSocketId = match.players.white.socketId;
        const blackSocketId = match.players.black.socketId;

        // Join both sockets to the game room
        socket.join(match.gameId);
        io.sockets.sockets.get(
          socket.id === whiteSocketId ? blackSocketId : whiteSocketId
        )?.join(match.gameId);

        const commonPayload = {
          gameId: match.gameId,
          board:  gameState.board,
          pickUpLine,
          players: {
            white: whiteSocketId,
            black: blackSocketId,
          },
          whiteTime:  gameState.whiteTime,
          blackTime:  gameState.blackTime,
          lastMoveAt: gameState.lastMoveAt,
        };

        io.to(whiteSocketId).emit('game_start', {
          ...commonPayload,
          playerColor:   'white',
          opponentColor: 'black',
        });

        io.to(blackSocketId).emit('game_start', {
          ...commonPayload,
          playerColor:   'black',
          opponentColor: 'white',
        });

        console.log(`Game ${match.gameId} started — white: ${whiteSocketId}, black: ${blackSocketId}`);

      } else {
        // No match found — start bot fallback timer (7–16 seconds)
        botService.startFallbackTimer(socket.id, socket, io, gender);

        socket.emit('waiting_for_match', {
          message:       'Waiting for an opponent...',
          queuePosition: await matchmakingService.getQueueStats(),
        });
      }
    } catch (error) {
      console.error('Error in gender selection:', error);
      socket.emit('error', { message: 'Failed to join matchmaking' });
    }
  });

  socket.on('cancel_matchmaking', async () => {
    try {
      // Cancel bot fallback timer
      botService.cancelFallbackTimer(socket.id);
      await matchmakingService.removeFromQueue(socket.id);
      socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
    } catch (error) {
      console.error('Error cancelling matchmaking:', error);
      socket.emit('error', { message: 'Failed to cancel matchmaking' });
    }
  });

  socket.on('get_queue_stats', async () => {
    try {
      const stats = await matchmakingService.getQueueStats();
      socket.emit('queue_stats', stats);
    } catch (error) {
      socket.emit('error', { message: 'Failed to get queue stats' });
    }
  });
}

module.exports = matchmakingSocket;