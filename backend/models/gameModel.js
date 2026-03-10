// Game model for future analytics or database storage
class GameModel {
  constructor() {
    this.games = new Map(); // In-memory storage for now
  }

  // Create game record
  createGame(gameId, players) {
    const game = {
      id: gameId,
      players: {
        white: players.white.socketId,
        black: players.black.socketId
      },
      status: 'active',
      startedAt: new Date(),
      moves: [],
      chatMessages: [],
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date()
      }
    };

    this.games.set(gameId, game);
    return game;
  }

  // Update game with move
  addMove(gameId, move) {
    const game = this.games.get(gameId);
    if (game) {
      game.moves.push({
        ...move,
        timestamp: new Date()
      });
      game.metadata.lastActivity = new Date();
    }
  }

  // End game
  endGame(gameId, result) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'finished';
      game.endedAt = new Date();
      game.result = result;
      game.metadata.lastActivity = new Date();
    }
  }

  // Add chat message
  addChatMessage(gameId, message) {
    const game = this.games.get(gameId);
    if (game) {
      game.chatMessages.push({
        ...message,
        timestamp: new Date()
      });
    }
  }

  // Get game statistics
  getGameStats(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    return {
      id: game.id,
      duration: game.endedAt ? game.endedAt - game.startedAt : null,
      movesCount: game.moves.length,
      messagesCount: game.chatMessages.length,
      result: game.result,
      status: game.status
    };
  }

  // Clean up old games (for memory management)
  cleanupOldGames(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [gameId, game] of this.games.entries()) {
      if (game.status === 'finished' &&
          now - game.metadata.lastActivity.getTime() > maxAge) {
        this.games.delete(gameId);
      }
    }
  }
}

module.exports = new GameModel();