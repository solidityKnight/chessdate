'use strict';

const matchmakingService = require('../services/matchmakingService');
const gameManager        = require('../services/gameManager');
const aiService          = require('../services/aiService');
const creditSystem       = require('../utils/creditSystem');

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
        // Calculate remaining time for regen
        const now = new Date();
        const lastRegen = new Date(socket.user.lastCreditRegen);
        const nextRegen = new Date(lastRegen.getTime() + (6 * 60 * 60 * 1000));
        const diff = nextRegen - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        socket.emit('error', { 
          message: `You have run out of credits. Please come back in ${hours}h ${minutes}m.` 
        });
        return;
      }

      if (!['male', 'female'].includes(gender)) {
        socket.emit('error', { message: 'Invalid gender selection' });
        return;
      }

      console.log(`Player ${socket.id} selected gender: ${gender}`);

      const match = await matchmakingService.addToQueue(socket.id, gender, socket.user.id);

      if (match) {
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
        };

        /*
         * BUG FIX: the original emitted game_start to the whole room via
         * io.to(gameId).emit(...) with a single playerColor value derived
         * from the *current* socket.  Both players received the same color,
         * so the second player always saw the board from White's perspective
         * and their turn guard never allowed them to move.
         *
         * Fix: emit individually to each socket with their correct color.
         */
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