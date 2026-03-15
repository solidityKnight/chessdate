'use strict';

const matchmakingService = require('../services/matchmakingService');
const gameManager = require('../services/gameManager');
const aiService = require('../services/aiService');
const creditSystem = require('../utils/creditSystem');
const botService = require('../services/BotService');
const { User } = require('../models');

const publicPlayerAttributes = [
  'id',
  'username',
  'displayName',
  'profilePhoto',
  'isProfilePhotoVerified',
  'lastActiveAt',
  'country',
];

function matchmakingSocket(socket, io) {
  const loadPlayerProfile = async (userId) => {
    if (!userId || String(userId).startsWith('bot-')) {
      return null;
    }

    const user = await User.findByPk(userId, {
      attributes: publicPlayerAttributes,
    });

    return user ? user.toJSON() : null;
  };

  socket.on('select_gender', async (data) => {
    try {
      const preferredGender = data?.gender || 'any';

      if (!socket.user) {
        socket.emit('error', { message: 'Please sign in to play' });
        return;
      }

      await creditSystem.regenerateCredits(socket.user);

      if (!creditSystem.canPlay(socket.user)) {
        socket.emit('error', {
          message: 'You have run out of credits.'
        });
        return;
      }

      if (!['male', 'female', 'any'].includes(preferredGender)) {
        socket.emit('error', { message: 'Invalid matchmaking preference' });
        return;
      }

      const requestedPreferences =
        preferredGender === 'any' ? ['male', 'female'] : [preferredGender];

      console.log(
        `Player ${socket.id} queued with preference: ${requestedPreferences.join(', ')}`
      );

      const match = await matchmakingService.addToQueue(socket.id, preferredGender, {
        userId: socket.user.id,
        selfGender: socket.user.gender,
        matchPreferences: data?.matchPreferences || requestedPreferences,
        eloRating: data?.eloRating,
        latitude: data?.latitude,
        longitude: data?.longitude,
        preferredDistance: data?.preferredDistance
      });

      if (match) {
        botService.cancelFallbackTimer(match.players.white.socketId);
        botService.cancelFallbackTimer(match.players.black.socketId);

        const gameState = await gameManager.createGame(match.gameId, match.players);
        const pickUpLine = await aiService.generateChessPickUpLine();
        const [whiteProfile, blackProfile] = await Promise.all([
          loadPlayerProfile(match.players.white.userId),
          loadPlayerProfile(match.players.black.userId),
        ]);

        const whiteSocketId = match.players.white.socketId;
        const blackSocketId = match.players.black.socketId;

        socket.join(match.gameId);
        io.sockets.sockets.get(
          socket.id === whiteSocketId ? blackSocketId : whiteSocketId
        )?.join(match.gameId);

        const commonPayload = {
          gameId: match.gameId,
          board: gameState.board,
          pickUpLine,
          players: {
            white: whiteSocketId,
            black: blackSocketId,
          },
          playerProfiles: {
            white: whiteProfile,
            black: blackProfile,
          },
          whiteTime: gameState.whiteTime,
          blackTime: gameState.blackTime,
          lastMoveAt: gameState.lastMoveAt,
        };

        io.to(whiteSocketId).emit('game_start', {
          ...commonPayload,
          playerColor: 'white',
          opponentColor: 'black',
          opponentProfile: blackProfile,
        });

        io.to(blackSocketId).emit('game_start', {
          ...commonPayload,
          playerColor: 'black',
          opponentColor: 'white',
          opponentProfile: whiteProfile,
        });

        console.log(
          `Game ${match.gameId} started - white: ${whiteSocketId}, black: ${blackSocketId}`
        );
      } else {
        const botPreference =
          preferredGender === 'any'
            ? socket.user.gender === 'male'
              ? 'female'
              : 'male'
            : preferredGender;

        botService.startFallbackTimer(socket.id, socket, io, botPreference);

        socket.emit('waiting_for_match', {
          message: 'Waiting for an opponent...',
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
