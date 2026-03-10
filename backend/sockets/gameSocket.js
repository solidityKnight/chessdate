'use strict';

const gameManager  = require('../services/gameManager');
const chessService = require('../services/chessService');

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

    const gameState = await gameManager.getGameState(gameId);
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
      const result = await gameManager.makeMove(gameId, from, to, promotion);
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
      });

      if (gameState.status === 'finished') {
        io.to(gameId).emit('game_over', {
          winner:     gameState.winner     || null,
          result:     gameState.result,
          finalBoard: gameState.board,
        });
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

      const { playerColor, gameState } = guard;

      gameState.status = 'finished';
      gameState.result = 'resignation';
      gameState.winner = playerColor === 'white' ? 'black' : 'white';

      // Persist through the manager's internal save helper.
      // If GameManager later exposes a resignGame() method, call that instead.
      await gameManager._save(gameId, gameState);

      // Reflect finished status in the in-memory cache.
      const cached = gameManager.games.get(gameId);
      if (cached) cached.status = 'finished';

      io.to(gameId).emit('game_over', {
        winner:     gameState.winner,
        result:     'resignation',
        resignedBy: playerColor,
        finalBoard: gameState.board,
      });

      setTimeout(() => gameManager.cleanupGame(gameId), 5_000);
    } catch (err) {
      console.error('resign_game error:', err);
      emitError('resign_game', 'Failed to resign game');
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

      const gameState = await gameManager.getGameState(gameId);
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

      const gameState = await gameManager.getGameState(gameId);
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