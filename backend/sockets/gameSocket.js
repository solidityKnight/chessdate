'use strict';

const gameManager  = require('../services/gameManager');
const chessService = require('../services/chessService');
const aiService    = require('../services/aiService');
const botService   = require('../services/BotService');

/**
 * Attach all chess-game socket event handlers to a single socket.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server}  io
 */
function gameSocket(socket, io) {

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Emit a structured error to the requesting socket only.
   *
   * @param {string} event   Original event name (for context on the client).
   * @param {string} message Human-readable reason.
   */
  function emitError(event, message) {
    socket.emit('error', { event, message });
  }

  /**
   * Guard: verify the socket belongs to the game and the game is active.
   * Returns { playerColor, gameState } on success, or null after emitting
   * the appropriate error.
   *
   * Centralising this check eliminates the repeated boilerplate that existed
   * in the original and ensures every handler uses the same validation path.
   *
   * @param {string} gameId
   * @param {string} callerEvent
   * @returns {Promise<{ playerColor: string, gameState: object }|null>}
   */
  async function guardActivePlayer(gameId, callerEvent) {
    const playerColor = gameManager.getPlayerColor(gameId, socket.id);
    if (!playerColor) {
      emitError(callerEvent, 'You are not in this game');
      return null;
    }

    // Skip Redis for the status check if it's cached.
    const gameState = await gameManager.getGameState(gameId, false);
    if (!gameState || gameState.status !== 'active') {
      emitError(callerEvent, 'Game not active');
      return null;
    }

    return { playerColor, gameState };
  }

  // ─── make_move ───────────────────────────────────────────────────────────

  /**
   * BUG FIX: the original validated the move via chessService.validateMove
   * and then re-applied it inside gameManager.makeMove — the board could
   * theoretically change between those two calls (race condition in async
   * environments, or if the cache and Redis diverged).  The validation step
   * is redundant because gameManager.makeMove already throws on an illegal
   * move.  Removed the double-apply; trust the manager as the single point
   * of truth.
   *
   * BUG FIX: the original emitted `game_over` *inside* the `make_move`
   * handler but also derived game status by calling
   * chessService.getGameStatus(board) separately — so the move_made payload
   * and game_over payload could describe different states if something went
   * wrong between the two calls.  Now both payloads are derived from the
   * single result returned by makeMove.
   */
  socket.on('make_move', async (data) => {
    try {
      const { gameId, from, to, promotion } = data ?? {};

      if (!gameId || !from || !to) {
        emitError('make_move', 'Missing required fields: gameId, from, to');
        return;
      }

      const guard = await guardActivePlayer(gameId, 'make_move');
      if (!guard) return;

      const { playerColor } = guard;

      // Verify it is this player's turn.
      const currentTurn = guard.gameState.board.split(' ')[1]; // 'w' or 'b'
      const expectedTurn = playerColor === 'white' ? 'w' : 'b';
      if (currentTurn !== expectedTurn) {
        emitError('make_move', 'It is not your turn');
        return;
      }

      // Apply move — throws on illegal move or invalid game state.
      const result = await gameManager.makeMove(gameId, from, to, promotion, io);
      const { move, gameState } = result;

      // Derive status once from the authoritative post-move state.
      const gameStatus = chessService.getGameStatus(gameState.board);

      io.to(gameId).emit('move_made', {
        from,
        to,
        promotion:  move.promotion || null,
        move,
        board:      gameState.board,
        player:     playerColor,
        gameStatus,
        whiteTime:  gameState.whiteTime,
        blackTime:  gameState.blackTime,
        lastMoveAt: gameState.lastMoveAt,
      });

      if (gameState.status === 'finished') {
        io.to(gameId).emit('game_over', {
          winner:     gameState.winner     || null,
          result:     gameState.result,
          finalBoard: gameState.board,
        });

        // Clean up bot game if applicable
        if (botService.isBotGame(gameId)) {
          setTimeout(() => {
            gameManager.cleanupGame(gameId);
            botService.cleanupBotGame(gameId);
          }, 60_000);
        }
      } else if (botService.isBotGame(gameId)) {
        // Trigger the bot's reply move (with human-like delay)
        const fenBefore = guard.gameState.board; // FEN before the player's move
        botService.onPlayerMove(gameId, io, fenBefore, gameState.board, move.san);
      }
    } catch (err) {
      console.error('make_move error:', err);
      // Expose illegal-move errors to the client; hide internals.
      const isUserError = /illegal move|not found|not active/i.test(err.message);
      socket.emit('invalid_move', {
        error: isUserError ? err.message : 'Failed to make move',
      });
    }
  });

  // ─── resign_game ─────────────────────────────────────────────────────────

  /**
   * BUG FIX: the original wrote directly to Redis via redisClient.set,
   * bypassing gameManager entirely.  This means gameManager's in-memory
   * cache is left with status 'active', so subsequent calls (e.g. another
   * make_move before cleanup) would not see the resignation.
   * Fixed by delegating persistence to gameManager._save (exposed indirectly
   * via a new resignGame method would be ideal; for now we use getGameState
   * + cleanupGame and keep the Redis write inside the manager layer).
   *
   * Since GameManager doesn't yet expose a resignGame method, we replicate
   * the minimal state mutation here and call cleanupGame for teardown,
   * matching the same pattern used by handlePlayerDisconnect.
   */
  socket.on('resign_game', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) {
        emitError('resign_game', 'Missing required field: gameId');
        return;
      }

      const guard = await guardActivePlayer(gameId, 'resign_game');
      if (!guard) return;

      const { playerColor } = guard;

      const gameState = await gameManager.resignGame(gameId, playerColor, io);

      io.to(gameId).emit('game_over', {
        winner:     gameState.winner,
        result:     'resignation',
        resignedBy: playerColor,
        finalBoard: gameState.board,
      });

      setTimeout(() => gameManager.cleanupGame(gameId), 60_000);
    } catch (err) {
      console.error('resign_game error:', err);
      emitError('resign_game', 'Failed to resign game');
    }
  });

  // ─── claim_timeout ────────────────────────────────────────────────────────

  socket.on('claim_timeout', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) {
        emitError('claim_timeout', 'Missing required field: gameId');
        return;
      }

      const guard = await guardActivePlayer(gameId, 'claim_timeout');
      if (!guard) return;

      const gameState = await gameManager.claimTimeout(gameId, io);

      if (gameState && gameState.status === 'finished') {
        io.to(gameId).emit('game_over', {
          winner:     gameState.winner,
          result:     'timeout',
          finalBoard: gameState.board,
        });

        setTimeout(() => gameManager.cleanupGame(gameId), 60_000);
      }
    } catch (err) {
      console.error('claim_timeout error:', err);
      emitError('claim_timeout', 'Failed to claim timeout');
    }
  });

  // ─── get_game_state ──────────────────────────────────────────────────────

  socket.on('get_game_state', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) {
        emitError('get_game_state', 'Missing required field: gameId');
        return;
      }

      const gameState = await gameManager.getGameState(gameId);
      if (!gameState) {
        emitError('get_game_state', 'Game not found');
        return;
      }

      socket.emit('game_state', gameState);
    } catch (err) {
      console.error('get_game_state error:', err);
      emitError('get_game_state', 'Failed to get game state');
    }
  });

  // ─── get_possible_moves ──────────────────────────────────────────────────

  /**
   * BUG FIX: the original accepted an arbitrary FEN from the client and
   * passed it directly to chessService.  A malicious or out-of-sync client
   * could query moves for any position.  We now look up the canonical board
   * FEN from the server-side game state.
   */
  socket.on('get_possible_moves', async (data) => {
    try {
      const { gameId, square } = data ?? {};
      if (!gameId || !square) {
        emitError('get_possible_moves', 'Missing required fields: gameId, square');
        return;
      }

      // Fast path: use cache only for move generation
      const gameState = await gameManager.getGameState(gameId, false);
      if (!gameState) {
        emitError('get_possible_moves', 'Game not found');
        return;
      }

      const moves = chessService.getPossibleMoves(gameState.board, square);
      socket.emit('possible_moves', { square, moves });
    } catch (err) {
      console.error('get_possible_moves error:', err);
      emitError('get_possible_moves', 'Failed to get possible moves');
    }
  });

  // ─── rematch ────────────────────────────────────────────────────────────

  socket.on('request_rematch', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) return;

      const gameState = await gameManager.getGameState(gameId);
      if (!gameState) return;

      // Special handling for bot games: automatically accept and start
      if (botService.isBotGame(gameId)) {
        const botGame = botService.getBotGame(gameId);
        if (!botGame) return;

        // Swap colors for rematch
        const nextWhiteSocketId = botGame.humanColor === 'white' ? botGame.botPlayer.socketId : botGame.humanSocketId;
        const nextBlackSocketId = botGame.humanColor === 'white' ? botGame.humanSocketId : botGame.botPlayer.socketId;

        const players = {
          white: { 
            socketId: nextWhiteSocketId, 
            userId: nextWhiteSocketId.startsWith('bot') ? botGame.botPlayer.userId : (socket.user?.id || null)
          },
          black: { 
            socketId: nextBlackSocketId, 
            userId: nextBlackSocketId.startsWith('bot') ? botGame.botPlayer.userId : (socket.user?.id || null)
          },
          botName: botGame.botPlayer.name
        };

        const newGameId = `game_${Date.now()}_bot_rematch`;
        const newGameState = await gameManager.createGame(newGameId, players);
        const pickUpLine = await aiService.generateChessPickUpLine();

        const humanColor = botGame.humanColor === 'white' ? 'black' : 'white';
        const botColor   = botGame.humanColor === 'white' ? 'white' : 'black';

        socket.join(newGameId);

        const commonPayload = {
          gameId: newGameId,
          board: newGameState.board,
          pickUpLine,
          players: {
            white: players.white.socketId,
            black: players.black.socketId,
          },
          whiteTime:  newGameState.whiteTime,
          blackTime:  newGameState.blackTime,
          lastMoveAt: newGameState.lastMoveAt,
        };

        // Notify human player
        socket.emit('game_start', {
          ...commonPayload,
          playerColor: humanColor,
          opponentColor: botColor,
        });

        // Initialize new bot session
        botService.botGames.set(newGameId, {
          difficulty: botGame.difficulty,
          botPlayer: botGame.botPlayer,
          botColor,
          humanSocketId: socket.id,
          humanColor,
          pendingMoveTimer: null,
        });

        const botMsgGenerator = require('../services/BotMessageGenerator');
        botMsgGenerator.initSession(newGameId, {
          botGender: botGame.botPlayer.gender,
          botName: botGame.botPlayer.name,
          botColor,
          botSocketId: botGame.botPlayer.socketId,
          humanSocketId: socket.id,
        });

        botMsgGenerator.scheduleGreeting(newGameId, io);

        if (botColor === 'white') {
          botService._scheduleBotMove(newGameId, io, 'normal');
        }

        // Cleanup old room
        socket.leave(gameId);
        await gameManager.cleanupGame(gameId);
        botService.cleanupBotGame(gameId);
        return;
      }

      socket.to(gameId).emit('rematch_requested', { from: socket.id });
    } catch (err) {
      console.error('request_rematch error:', err);
    }
  });

  socket.on('accept_rematch', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) {
        emitError('accept_rematch', 'Missing required field: gameId');
        return;
      }

      const gameState = await gameManager.getGameState(gameId, true);
      if (!gameState) {
        emitError('accept_rematch', 'Game not found');
        return;
      }
      if (!gameState.userIds?.white || !gameState.userIds?.black) {
        emitError('accept_rematch', 'Game is missing player identities');
        return;
      }

      const nextWhiteUserId = gameState.userIds.black;
      const nextBlackUserId = gameState.userIds.white;

      const findSocketByUserIdInRoom = async (roomId, userId) => {
        const socketIds = await io.in(roomId).allSockets();
        for (const id of socketIds) {
          const s = io.sockets.sockets.get(id);
          if (s?.user?.id === userId) return s;
        }
        return null;
      };

      const findSocketByUserIdGlobal = (userId) => {
        for (const s of io.sockets.sockets.values()) {
          if (s?.user?.id === userId) return s;
        }
        return null;
      };

      const whiteSocket =
        (await findSocketByUserIdInRoom(gameId, nextWhiteUserId)) ||
        findSocketByUserIdGlobal(nextWhiteUserId) ||
        io.sockets.sockets.get(gameState.players.black);
      const blackSocket =
        (await findSocketByUserIdInRoom(gameId, nextBlackUserId)) ||
        findSocketByUserIdGlobal(nextBlackUserId) ||
        io.sockets.sockets.get(gameState.players.white);

      if (!whiteSocket || !blackSocket) {
        emitError('accept_rematch', 'Opponent is not connected');
        return;
      }

      // Start new one with same players (swap colors for rematch)
      const players = {
        white: { socketId: whiteSocket.id, userId: nextWhiteUserId },
        black: { socketId: blackSocket.id, userId: nextBlackUserId }
      };
      
      // Generate new game ID for rematch
      const newGameId = `game_${Date.now()}_rematch`;
      const newGameState = await gameManager.createGame(newGameId, players);
      const pickUpLine = await aiService.generateChessPickUpLine();

      // Join both sockets to new room
      whiteSocket.join(newGameId);
      blackSocket.join(newGameId);

      const commonPayload = {
        gameId: newGameId,
        board: newGameState.board,
        pickUpLine,
        players: {
          white: players.white.socketId,
          black: players.black.socketId,
        },
      };

      io.to(players.white.socketId).emit('game_start', {
        ...commonPayload,
        playerColor: 'white',
        opponentColor: 'black',
      });

      io.to(players.black.socketId).emit('game_start', {
        ...commonPayload,
        playerColor: 'black',
        opponentColor: 'white',
      });

      // Cleanup old game room
      whiteSocket.leave(gameId);
      blackSocket.leave(gameId);
      await gameManager.cleanupGame(gameId);

    } catch (err) {
      console.error('accept_rematch error:', err);
      emitError('accept_rematch', 'Failed to start rematch');
    }
  });

  socket.on('decline_rematch', async (data) => {
    const { gameId } = data ?? {};
    if (gameId) {
      socket.to(gameId).emit('rematch_declined');
    }
  });

  // ─── request_new_game ────────────────────────────────────────────────────

  /**
   * BUG FIX: the original called socket.leave(gameId) *before* saving the
   * updated newGameRequests back to Redis — so socket.to(gameId) would never
   * reach the requesting socket in subsequent events and room membership was
   * inconsistent.  Leave is now deferred until after all Redis writes.
   *
   * BUG FIX: the original saved to Redis *after* calling cleanupGame when
   * both players were ready — but cleanupGame deletes the Redis key, making
   * the subsequent set() re-create a stale record.  The save is now skipped
   * in the two-player case.
   *
   * BUG FIX: emitted 'game_cleanup_complete' to io.to(gameId) *after*
   * calling cleanupGame (which deletes the room).  The socket had also
   * already left the room by that point in the original.  Now we emit before
   * cleanup and leave after.
   */
  socket.on('request_new_game', async (data) => {
    try {
      const { gameId } = data ?? {};
      if (!gameId) {
        emitError('request_new_game', 'Missing required field: gameId');
        return;
      }

      const gameState = await gameManager.getGameState(gameId, true);
      if (!gameState) {
        socket.emit('ready_for_new_match');
        return;
      }

      if (!Array.isArray(gameState.newGameRequests)) {
        gameState.newGameRequests = [];
      }

      if (!gameState.newGameRequests.includes(socket.id)) {
        gameState.newGameRequests.push(socket.id);
      }

      if (gameState.newGameRequests.length >= 2) {
        // Both players ready — notify, then clean up.
        io.to(gameId).emit('game_cleanup_complete');
        await gameManager.cleanupGame(gameId);
        // Do NOT save after cleanupGame — it would re-create the deleted key.
      } else {
        // First request — persist and notify opponent.
        await gameManager._save(gameId, gameState);
        socket.to(gameId).emit('opponent_requested_new_game');
      }

      // Leave the room after all room-targeted emits are done.
      socket.leave(gameId);
      socket.emit('ready_for_new_match');
    } catch (err) {
      console.error('request_new_game error:', err);
      emitError('request_new_game', 'Failed to request new game');
    }
  });
}

module.exports = gameSocket;
