const matchmakingService = require('../services/matchmakingService');
const gameManager = require('../services/gameManager');

function matchmakingSocket(socket, io) {
  // Handle gender selection and matchmaking
  socket.on('select_gender', async (data) => {
    try {
      const { gender } = data;

      if (!['male', 'female'].includes(gender)) {
        socket.emit('error', { message: 'Invalid gender selection' });
        return;
      }

      console.log(`Player ${socket.id} selected gender: ${gender}`);

      // Add player to matchmaking queue
      const match = await matchmakingService.addToQueue(socket.id, gender);

      if (match) {
        // Match found! Create game
        const gameState = await gameManager.createGame(match.gameId, match.players);

        // Join game room
        socket.join(match.gameId);
        const opponentSocketId = match.players.white.socketId === socket.id ?
          match.players.black.socketId : match.players.white.socketId;
        io.sockets.sockets.get(opponentSocketId)?.join(match.gameId);

        // Determine player colors
        const playerColor = match.players.white.socketId === socket.id ? 'white' : 'black';
        const opponentColor = playerColor === 'white' ? 'black' : 'white';

        // Notify both players
        io.to(match.gameId).emit('game_start', {
          gameId: match.gameId,
          playerColor,
          opponentColor,
          board: gameState.board,
          players: {
            [playerColor]: socket.id,
            [opponentColor]: opponentSocketId
          }
        });

        console.log(`Game ${match.gameId} started between ${match.players.white.socketId} and ${match.players.black.socketId}`);
      } else {
        // No match found, player is in queue
        socket.emit('waiting_for_match', {
          message: 'Waiting for an opponent...',
          queuePosition: await matchmakingService.getQueueStats()
        });
      }
    } catch (error) {
      console.error('Error in gender selection:', error);
      socket.emit('error', { message: 'Failed to join matchmaking' });
    }
  });

  // Handle matchmaking cancellation
  socket.on('cancel_matchmaking', async () => {
    try {
      await matchmakingService.removeFromQueue(socket.id);
      socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
    } catch (error) {
      console.error('Error cancelling matchmaking:', error);
      socket.emit('error', { message: 'Failed to cancel matchmaking' });
    }
  });

  // Handle request for queue stats
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