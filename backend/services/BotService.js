'use strict';

/**
 * BotService — Central hub for bot lifecycle management:
 *  - Bot difficulty selection & creation
 *  - Fallback timer management
 *  - Bot game creation (via gameManager)
 *  - Bot move scheduling with human-like delays
 *  - Chat integration via BotMessageGenerator
 */

const gameManager       = require('./gameManager');
const chessBotEngine    = require('./ChessBotEngine');
const chessService      = require('./chessService');
const messageGenerator  = require('./BotMessageGenerator');
const aiService         = require('./aiService');
const settingsService   = require('./SettingsService');
const chessLearningService = require('./chessLearningService');
const { User } = require('../models');

// ─── Bot difficulty weights ────────────────────────────────────────────────
// Total = 100%.  Adjusted per user spec (Easy 10, Medium 30, Hard 50, Super Hard 5, Extreme Hard 5).
const BOT_DIFFICULTY_WEIGHTS = [
  { difficulty: 'easy',        weight: 10 },
  { difficulty: 'medium',      weight: 30 },
  { difficulty: 'hard',        weight: 50 },
  { difficulty: 'superhard',   weight: 5  },
  { difficulty: 'extremehard', weight: 5  },
];

const BOT_NAMES = {
  easy:        ['Luna', 'Mia', 'Zoe', 'Aria', 'Kai', 'Leo', 'Finn', 'Eli'],
  medium:      ['Sophie', 'Ava', 'Lily', 'Nova', 'Ryan', 'Jake', 'Tyler', 'Max'],
  hard:        ['Elena', 'Maya', 'Clara', 'Iris', 'Ethan', 'Lucas', 'Adrian', 'Cole'],
  superhard:   ['Valentina', 'Natasha', 'Aurora', 'Athena', 'Viktor', 'Dante', 'Magnus', 'Atlas'],
  extremehard: ['Seraphina', 'Morgana', 'Celestia', 'Kasparov', 'Fischer', 'Tal'],
};

class BotService {
  constructor() {
    /** @type {Map<string, NodeJS.Timeout>} socketId → fallback timer */
    this.fallbackTimers = new Map();

    /**
     * Active bot games.
     * Key: gameId
     * Value: {
     *   difficulty: string,
     *   botPlayer: object,
     *   botColor: 'white'|'black',
     *   humanSocketId: string,
     *   humanColor: 'white'|'black',
     *   pendingMoveTimer: NodeJS.Timeout | null,
     * }
     */
    this.botGames = new Map();
  }

  // ─── Difficulty selection ────────────────────────────────────────────────

  /**
   * Weighted random selection of bot difficulty.
   * @returns {string}
   */
  selectBotDifficulty() {
    const totalWeight = BOT_DIFFICULTY_WEIGHTS.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const entry of BOT_DIFFICULTY_WEIGHTS) {
      random -= entry.weight;
      if (random <= 0) return entry.difficulty;
    }
    return 'medium';
  }

  /**
   * Create a virtual bot player object.
   * @param {string} difficulty
   * @param {'male'|'female'} botGender - opposite of the real player
   * @returns {{ socketId: string, userId: string, difficulty: string, name: string, gender: string }}
   */
  createBotPlayer(difficulty, botGender) {
    const id = `bot_${difficulty}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    return {
      socketId: id,
      userId: `bot-${difficulty}`,
      difficulty,
      name: aiService.assignBotName(botGender),
      gender: botGender,
    };
  }

  // ─── Fallback timer management ───────────────────────────────────────────

  /**
   * Start a fallback timer for a socket. If no real match is found within
   * the random delay (7–16 seconds), connect the player to a bot.
   *
   * @param {string} socketId
   * @param {import('socket.io').Socket} socket
   * @param {import('socket.io').Server} io
   * @param {string} playerGender - the real player's selected gender
   */
  startFallbackTimer(socketId, socket, io, playerGender) {
    // Check if bots are enabled
    if (!settingsService.areBotsEnabled()) {
      console.log(`🤖 Bot fallback skipped (bots disabled) for ${socketId}`);
      return;
    }

    this.cancelFallbackTimer(socketId);

    const delay = 7000 + Math.random() * 9000; // 7–16 seconds
    console.log(`🤖 Bot fallback timer started for ${socketId}: ${Math.round(delay)}ms`);

    const timer = setTimeout(async () => {
      this.fallbackTimers.delete(socketId);

      // Create and start a bot game
      try {
        await this.startBotGame(socket, io, playerGender);
        // Remove from queue ONLY if bot game started successfully
        const matchmakingService = require('./matchmakingService');
        await matchmakingService.removeFromQueue(socketId);
      } catch (err) {
        console.error('Bot game start error:', err);
        socket.emit('error', { message: 'Failed to start bot match. Please try again.' });
        // If it failed, we could optionally leave them in queue or notify them.
        // For now, we just log the error. The player is still in the queue
        // so a real match might still happen, or they can cancel.
      }
    }, delay);

    this.fallbackTimers.set(socketId, timer);
  }

  /**
   * Cancel the fallback timer for a socket (e.g. when a real match is found).
   * @param {string} socketId
   */
  cancelFallbackTimer(socketId) {
    const timer = this.fallbackTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.fallbackTimers.delete(socketId);
      console.log(`🤖 Bot fallback timer cancelled for ${socketId}`);
    }
  }

  // ─── Bot game lifecycle ──────────────────────────────────────────────────

  /**
   * Start a bot game for a player.
   *
   * @param {import('socket.io').Socket} socket - the human player's socket
   * @param {import('socket.io').Server} io
   * @param {string} playerGender - the human's selected gender
   */
  async startBotGame(socket, io, playerGender) {
    // Double-check bots are still enabled when timer fires
    if (!settingsService.areBotsEnabled()) {
      console.log(`🤖 Bot game skipped (bots disabled) for ${socket.id}`);
      return;
    }

    const difficulty = this.selectBotDifficulty();
    const botGender = playerGender === 'male' ? 'female' : 'male';
    const botPlayer = this.createBotPlayer(difficulty, botGender);

    // Randomly assign colors
    const humanIsWhite = Math.random() < 0.5;
    const players = humanIsWhite
      ? {
          white: { socketId: socket.id, userId: socket.user?.id || null },
          black: { socketId: botPlayer.socketId, userId: botPlayer.userId },
          botName: botPlayer.name,
        }
      : {
          white: { socketId: botPlayer.socketId, userId: botPlayer.userId },
          black: { socketId: socket.id, userId: socket.user?.id || null },
          botName: botPlayer.name,
        };

    const gameId = `game_${Date.now()}_bot_${Math.random().toString(36).substr(2, 6)}`;

    // Create game via gameManager (it will skip PG persistence for bot games)
    const gameState = await gameManager.createGame(gameId, players);
    const pickUpLine = await aiService.generateChessPickUpLine();

    const humanColor = humanIsWhite ? 'white' : 'black';
    const botColor   = humanIsWhite ? 'black' : 'white';

    // Track the bot game
    this.botGames.set(gameId, {
      difficulty,
      botPlayer,
      botColor,
      humanSocketId: socket.id,
      humanColor,
      pendingMoveTimer: null,
    });

    // Join the human socket to the game room
    socket.join(gameId);

    // Emit game_start to the human player
    const commonPayload = {
      gameId,
      board: gameState.board,
      pickUpLine,
      players: {
        white: players.white.socketId,
        black: players.black.socketId,
      },
      whiteTime:  gameState.whiteTime,
      blackTime:  gameState.blackTime,
      lastMoveAt: gameState.lastMoveAt,
    };

    io.to(socket.id).emit('game_start', {
      ...commonPayload,
      playerColor:   humanColor,
      opponentColor: botColor,
    });

    console.log(`🤖 Bot game started: ${gameId} | ${botPlayer.name} (${difficulty}, ${botGender}) as ${botColor} vs ${socket.id} as ${humanColor}`);

    // Initialize chat session
    messageGenerator.initSession(gameId, {
      botGender,
      botName: botPlayer.name,
      botColor,
      botSocketId: botPlayer.socketId,
      humanSocketId: socket.id,
    });

    // Schedule greeting chat message
    messageGenerator.scheduleGreeting(gameId, io);

    // If bot is white, schedule its first move
    if (botColor === 'white') {
      this._scheduleBotMove(gameId, io, 'normal');
    }
  }

  /**
   * Check if a game is a bot game.
   * @param {string} gameId
   * @returns {boolean}
   */
  isBotGame(gameId) {
    return this.botGames.has(gameId);
  }

  /**
   * Get bot game info.
   * @param {string} gameId
   * @returns {object|null}
   */
  getBotGame(gameId) {
    return this.botGames.get(gameId) || null;
  }

  /**
   * Called after the human player makes a move.
   * Classifies the move, schedules the bot's response with appropriate delay.
   *
   * @param {string} gameId
   * @param {import('socket.io').Server} io
   * @param {string} fenBefore - FEN before the human's move
   * @param {string} fenAfter  - FEN after the human's move
   * @param {string} lastMoveSan - SAN of the human's move
   */
  async onPlayerMove(gameId, io, fenBefore, fenAfter, lastMoveSan) {
    const botGame = this.botGames.get(gameId);
    if (!botGame) return;

    // Check if game is still active
    const gameState = await gameManager.getGameState(gameId, false);
    if (!gameState || gameState.status !== 'active') return;

    // Classify the player's move
    const moveQuality = chessBotEngine.classifyPlayerMove(fenBefore, fenAfter);

    // Learn While Dating Mode integration
    try {
      const socket = io.sockets.sockets.get(botGame.humanSocketId);
      if (socket && socket.user) {
        const user = await User.findByPk(socket.user.id);
        if (user && user.learnMode) {
          // We need the full move object for tactic detection
          const { Chess } = require('chess.js');
          const chess = new Chess(fenBefore);
          const move = chess.move(lastMoveSan);
          
          if (move) {
            const tip = chessLearningService.detectTactic(fenBefore, move, fenAfter);
            if (tip) {
              const isBeginner = (user.eloRating || 1200) < 1000;
              const probability = isBeginner ? 0.9 : 0.5;
              if (Math.random() < probability) {
                socket.emit('learning_tip', tip);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in Bot Learn Mode detection:', err);
    }

    // Trigger chat reaction
    messageGenerator.onMoveMade(gameId, io, {
      fen: fenAfter,
      lastMoveSan,
      moveQuality,
    });

    // Schedule the bot's reply move with human-like delay
    this._scheduleBotMove(gameId, io, moveQuality);
  }

  /**
   * Called after the bot makes a move.
   * Emits learning tips for bot's tactical moves.
   */
  async _handleBotLearnTips(gameId, io, fenBefore, fenAfter, move) {
    const botGame = this.botGames.get(gameId);
    if (!botGame) return;

    try {
      const socket = io.sockets.sockets.get(botGame.humanSocketId);
      if (socket && socket.user) {
        const user = await User.findByPk(socket.user.id);
        if (user && user.learnMode) {
          const tip = chessLearningService.detectTactic(fenBefore, move, fenAfter);
          if (tip) {
            const isBeginner = (user.eloRating || 1200) < 1000;
            const probability = isBeginner ? 0.7 : 0.3; // Slightly lower for bot moves
            if (Math.random() < probability) {
              socket.emit('learning_tip', {
                ...tip,
                message: `Watch out! ${tip.message.replace('!', '')}`,
                explanation: `The bot ${tip.explanation.charAt(0).toLowerCase() + tip.explanation.slice(1)}`
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in Bot Move Learn Mode detection:', err);
    }
  }

  /**
   * Handle a player chat message in a bot game.
   */
  onPlayerChat(gameId, io, message) {
    if (!this.botGames.has(gameId)) return;
    messageGenerator.onPlayerMessage(gameId, io, message);
  }

  /**
   * Clean up a bot game.
   * @param {string} gameId
   */
  cleanupBotGame(gameId) {
    const botGame = this.botGames.get(gameId);
    if (botGame) {
      if (botGame.pendingMoveTimer) {
        clearTimeout(botGame.pendingMoveTimer);
      }
      this.botGames.delete(gameId);
      messageGenerator.destroySession(gameId);
      console.log(`🤖 Bot game cleaned up: ${gameId}`);
    }
  }

  // ─── Internal: Bot move scheduling ───────────────────────────────────────

  /**
   * Schedule the bot's next move with a human-like delay.
   *
   * @param {string} gameId
   * @param {import('socket.io').Server} io
   * @param {'normal'|'strong'|'blunder'} moveQuality - quality of the preceding human move
   */
  _scheduleBotMove(gameId, io, moveQuality) {
    const botGame = this.botGames.get(gameId);
    if (!botGame) return;

    // Clear any existing pending move
    if (botGame.pendingMoveTimer) {
      clearTimeout(botGame.pendingMoveTimer);
    }

    // Human-like delay based on move quality
    let delay;
    if (moveQuality === 'strong') {
      delay = 10000 + Math.random() * 10000; // 10–20 seconds for strong moves
    } else {
      delay = 4000 + Math.random() * 2000;   // 4–6 seconds for normal moves
    }

    botGame.pendingMoveTimer = setTimeout(async () => {
      botGame.pendingMoveTimer = null;
      try {
        await this._executeBotMove(gameId, io);
      } catch (err) {
        console.error(`Bot move error in game ${gameId}:`, err);
      }
    }, delay);
  }

  /**
   * Execute the bot's move using the chess engine.
   */
  async _executeBotMove(gameId, io) {
    const botGame = this.botGames.get(gameId);
    if (!botGame) return;

    // Get current game state
    const gameState = await gameManager.getGameState(gameId, true);
    if (!gameState || gameState.status !== 'active') return;

    // Verify it's the bot's turn
    const currentTurn = gameState.board.split(' ')[1];
    const botTurnChar = botGame.botColor === 'white' ? 'w' : 'b';
    if (currentTurn !== botTurnChar) return;

    // Store FEN before move for classification
    const fenBefore = gameState.board;

    // Get bot's best move
    const bestMove = chessBotEngine.getBestMove(gameState.board, botGame.difficulty);
    if (!bestMove) return;

    // Apply the move via gameManager
    const result = await gameManager.makeMove(
      gameId, bestMove.from, bestMove.to, bestMove.promotion || null, io
    );

    const { move, gameState: updatedState } = result;
    const gameStatus = chessService.getGameStatus(updatedState.board);

    // Handle learning tips for bot moves
    await this._handleBotLearnTips(gameId, io, fenBefore, updatedState.board, move);

    // Emit move_made to the human player (same flow as a real player)
    io.to(gameId).emit('move_made', {
      from: bestMove.from,
      to: bestMove.to,
      promotion: move.promotion || null,
      move,
      board: updatedState.board,
      player: botGame.botColor,
      gameStatus,
      whiteTime:  updatedState.whiteTime,
      blackTime:  updatedState.blackTime,
      lastMoveAt: updatedState.lastMoveAt,
    });

    // Trigger chat reaction to bot's own move (occasionally)
    messageGenerator.onMoveMade(gameId, io, {
      fen: updatedState.board,
      lastMoveSan: bestMove.san,
      moveQuality: 'normal',
    });

    if (updatedState.status === 'finished') {
      io.to(gameId).emit('game_over', {
        winner:     updatedState.winner     || null,
        result:     updatedState.result,
        finalBoard: updatedState.board,
      });

      setTimeout(() => {
        gameManager.cleanupGame(gameId);
        this.cleanupBotGame(gameId);
      }, 60_000);
    }

    console.log(`🤖 Bot moved: ${bestMove.san} in game ${gameId}`);
  }
}

module.exports = new BotService();
