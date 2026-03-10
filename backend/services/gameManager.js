'use strict';

const { Chess } = require('chess.js');
const { redisClient } = require('../redis/redisClient');

/** @typedef {{ white: string, black: string }} Players */
/** @typedef {'active'|'finished'} GameStatus */

/**
 * @typedef {object} CacheEntry
 * @property {Chess}      chess
 * @property {Players}    players
 * @property {GameStatus} status
 */

/**
 * @typedef {object} GameState
 * @property {string}     gameId
 * @property {Players}    players
 * @property {string}     board       FEN string
 * @property {GameStatus} status
 * @property {object[]}   moves
 * @property {object[]}   chatMessages
 * @property {number}     createdAt
 * @property {number}     lastMoveAt
 * @property {string}     [winner]
 * @property {string}     [result]
 * @property {string}     [disconnectedPlayer]
 */

const REDIS_KEY  = (gameId) => `game:${gameId}`;
const CLEANUP_DELAY_MS = 10_000;

class GameManager {
  constructor() {
    /** @type {Map<string, CacheEntry>} In-memory cache for active games */
    this.games = new Map();
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  /**
   * Persist a GameState object to Redis.
   * Centralised so every writer goes through the same path.
   *
   * @param {string}    gameId
   * @param {GameState} gameState
   */
  async _save(gameId, gameState) {
    await redisClient.set(REDIS_KEY(gameId), JSON.stringify(gameState));
  }

  /**
   * Load raw GameState from Redis (no cache interaction).
   *
   * @param {string} gameId
   * @returns {Promise<GameState|null>}
   */
  async _loadFromRedis(gameId) {
    const raw = await redisClient.get(REDIS_KEY(gameId));
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Hydrate (or re-hydrate) the in-memory cache entry from a GameState.
   *
   * BUG FIX: original used `new Chess(fen)` — constructor signature is not
   * guaranteed across chess.js versions; use load() instead.
   *
   * @param {GameState} gameState
   * @returns {CacheEntry}
   */
  _hydrate(gameState) {
    const chess = new Chess();
    chess.load(gameState.board);
    const entry = {
      chess,
      players: gameState.players,
      status:  gameState.status,
    };
    this.games.set(gameState.gameId, entry);
    return entry;
  }

  /**
   * Determine draw reason from a finished Chess instance.
   *
   * @param {Chess} chess
   * @returns {string}
   */
  _drawReason(chess) {
    if (chess.isInsufficientMaterial()) return 'insufficient_material';
    if (chess.isThreefoldRepetition())  return 'threefold_repetition';
    if (chess.isStalemate())            return 'stalemate';
    return 'fifty_move_rule_or_agreement';
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Create a new game, persist to Redis, and prime the in-memory cache.
   *
   * @param {string} gameId
   * @param {{ white: { socketId: string }, black: { socketId: string } }} players
   * @returns {Promise<GameState>}
   */
  async createGame(gameId, players) {
    try {
      const chess = new Chess();

      /** @type {GameState} */
      const gameState = {
        gameId,
        players: {
          white: players.white.socketId,
          black: players.black.socketId,
        },
        board:        chess.fen(),
        status:       'active',
        moves:        [],
        chatMessages: [],
        createdAt:    Date.now(),
        lastMoveAt:   Date.now(),
      };

      await this._save(gameId, gameState);

      this.games.set(gameId, {
        chess,
        players: gameState.players,
        status:  gameState.status,
      });

      console.log(
        `Game ${gameId} created — white: ${players.white.socketId}, ` +
        `black: ${players.black.socketId}`
      );

      return gameState;
    } catch (err) {
      console.error('createGame error:', err);
      throw err;
    }
  }

  /**
   * Return the authoritative GameState for a game.
   *
   * BUG FIX: the original blended the cached Chess FEN with stale Redis data.
   * Since makeMove always flushes to Redis, Redis is the source of truth;
   * the in-memory cache only holds the live Chess instance (which can
   * diverge if the process restarts). Strategy: always read from Redis,
   * re-hydrate cache when the entry is missing.
   *
   * @param {string} gameId
   * @returns {Promise<GameState|null>}
   */
  async getGameState(gameId) {
    try {
      const gameState = await this._loadFromRedis(gameId);
      if (!gameState) return null;

      // Keep cache in sync with Redis.
      if (!this.games.has(gameId)) {
        this._hydrate(gameState);
      } else {
        // Update status in cache so getPlayerColor / move-guard stay correct.
        this.games.get(gameId).status = gameState.status;
      }

      return gameState;
    } catch (err) {
      console.error('getGameState error:', err);
      return null;
    }
  }

  /**
   * Apply a move to the game, update state, and persist.
   *
   * BUG FIX: original called getGameState() *after* mutating chess (which
   * reads from Redis and returns the pre-move board), then overwrote board
   * with the new FEN — a race-prone pattern. Now we load state first and
   * mutate afterward.
   *
   * BUG FIX: stalemate was checked *after* isDraw, but isDraw() already
   * returns true for stalemate — so result was always 'draw', never
   * 'stalemate'. Fixed by checking stalemate first.
   *
   * @param {string}      gameId
   * @param {string}      from
   * @param {string}      to
   * @param {string|null} [promotion]
   * @returns {Promise<{ move: object, gameState: GameState }>}
   */
  async makeMove(gameId, from, to, promotion = null) {
    try {
      // 1. Ensure cache is populated (re-hydrates from Redis if needed).
      let gameState = await this.getGameState(gameId);
      if (!gameState) {
        throw new Error(`Game ${gameId} not found`);
      }

      const game = this.games.get(gameId);

      if (game.status !== 'active') {
        throw new Error(`Game ${gameId} is not active (status: ${game.status})`);
      }

      // 2. Attempt the move.
      const moveOpts = { from, to };
      if (promotion) moveOpts.promotion = promotion.toLowerCase();

      const move = game.chess.move(moveOpts);
      if (!move) {
        throw new Error(`Illegal move: ${from}-${to}`);
      }

      // 3. Build updated state without re-fetching from Redis.
      gameState.board = game.chess.fen();
      gameState.moves.push({
        from,
        to,
        san:       move.san,
        piece:     move.piece,
        captured:  move.captured || null,
        promotion: move.promotion || null,
        timestamp: Date.now(),
      });
      gameState.lastMoveAt = Date.now();

      // 4. Evaluate game-over conditions in the right priority order.
      if (game.chess.isGameOver()) {
        gameState.status = 'finished';
        game.status      = 'finished';

        if (game.chess.isCheckmate()) {
          // chess.turn() is now the *losing* side.
          gameState.winner = game.chess.turn() === 'w' ? 'black' : 'white';
          gameState.result = 'checkmate';
        } else if (game.chess.isStalemate()) {
          // Check stalemate BEFORE isDraw — isDraw() returns true for stalemate.
          gameState.result = 'stalemate';
        } else if (game.chess.isDraw()) {
          gameState.result = this._drawReason(game.chess);
        }
      }

      // 5. Persist.
      await this._save(gameId, gameState);

      return { move, gameState };
    } catch (err) {
      console.error('makeMove error:', err);
      throw err;
    }
  }

  /**
   * Append a chat message to the game and persist.
   *
   * @param {string} gameId
   * @param {string} playerId
   * @param {string} message
   * @returns {Promise<object>}
   */
  async addChatMessage(gameId, playerId, message) {
    try {
      const gameState = await this.getGameState(gameId);
      if (!gameState) {
        throw new Error(`Game ${gameId} not found`);
      }

      const chatMessage = { playerId, message, timestamp: Date.now() };
      gameState.chatMessages.push(chatMessage);

      await this._save(gameId, gameState);

      return chatMessage;
    } catch (err) {
      console.error('addChatMessage error:', err);
      throw err;
    }
  }

  /**
   * Handle a socket disconnection.
   *
   * BUG FIX: original emitted 'opponent_disconnected' to the room via
   * io.to(gameId) — which would also deliver the event back to the
   * disconnecting socket (if it hadn't fully left yet) and fire twice on
   * reconnect scenarios. Now we emit only to the opponent's socket ID.
   *
   * @param {string} socketId
   * @param {import('socket.io').Server} io
   */
  async handlePlayerDisconnect(socketId, io) {
    try {
      for (const [gameId, game] of this.games.entries()) {
        const isWhite = game.players.white === socketId;
        const isBlack = game.players.black === socketId;

        if (!isWhite && !isBlack) continue;

        if (game.status !== 'active') break;

        const gameState = await this.getGameState(gameId);
        if (!gameState || gameState.status !== 'active') break;

        gameState.status            = 'finished';
        gameState.result            = 'disconnect';
        gameState.winner            = isWhite ? 'black' : 'white';
        gameState.disconnectedPlayer = socketId;

        game.status = 'finished';

        await this._save(gameId, gameState);

        // Emit only to the opponent, not the whole room.
        const opponentSocketId = isWhite ? game.players.black : game.players.white;
        io.to(opponentSocketId).emit('opponent_disconnected', {
          winner: gameState.winner,
          reason: 'opponent_disconnected',
        });

        setTimeout(() => this.cleanupGame(gameId), CLEANUP_DELAY_MS);

        break;
      }
    } catch (err) {
      console.error('handlePlayerDisconnect error:', err);
    }
  }

  /**
   * Remove a game from Redis and the in-memory cache.
   *
   * @param {string} gameId
   */
  async cleanupGame(gameId) {
    try {
      this.games.delete(gameId);
      await redisClient.del(REDIS_KEY(gameId));
      console.log(`Game ${gameId} cleaned up`);
    } catch (err) {
      console.error('cleanupGame error:', err);
    }
  }

  /**
   * Return the colour ('white' | 'black') of a socket in a game, or null.
   *
   * @param {string} gameId
   * @param {string} socketId
   * @returns {'white'|'black'|null}
   */
  getPlayerColor(gameId, socketId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.players.white === socketId) return 'white';
    if (game.players.black === socketId) return 'black';
    return null;
  }
}

module.exports = new GameManager();