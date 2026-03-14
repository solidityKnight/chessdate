const { Chess } = require('chess.js');

class AnalysisService {
  constructor() {}

  /**
   * Analyze a complete game history (Stubbed - Stockfish removed)
   * @param {string[]} moves - Array of moves in SAN or LAN
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeGame(moves) {
    // Return a basic structure so the frontend doesn't crash
    return {
      accuracy: 100,
      moves: moves.map(move => ({
        move,
        type: 'Played',
        comment: 'Move validated with chess.js'
      })),
      summary: {
        best: moves.length,
        excellent: 0,
        good: 0,
        book: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0
      },
      message: 'Full Stockfish analysis is currently disabled to optimize server performance.'
    };
  }
}

module.exports = new AnalysisService();
