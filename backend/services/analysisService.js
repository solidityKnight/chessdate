const { Chess } = require('chess.js');
const stockfish = require('stockfish.js');

class AnalysisService {
  constructor() {
    this.engine = null;
  }

  /**
   * Analyze a complete game history
   * @param {string[]} moves - Array of moves in SAN or LAN
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeGame(moves) {
    return new Promise((resolve, reject) => {
      const engine = stockfish();
      const chess = new Chess();
      const analysis = {
        accuracy: 0,
        moves: [],
        summary: {
          best: 0,
          excellent: 0,
          good: 0,
          book: 0,
          inaccuracy: 0,
          mistake: 0,
          blunder: 0
        }
      };

      let currentMoveIndex = 0;
      const totalMoves = moves.length;
      let totalEvalDiff = 0;

      const runAnalysis = () => {
        if (currentMoveIndex >= totalMoves) {
          // Calculate final accuracy (simplified)
          const avgLoss = totalMoves > 0 ? totalEvalDiff / totalMoves : 0;
          analysis.accuracy = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-0.004 * avgLoss))));
          engine.terminate();
          resolve(analysis);
          return;
        }

        const move = moves[currentMoveIndex];
        const fenBefore = chess.fen();
        
        try {
          chess.move(move);
        } catch (e) {
          console.error(`Invalid move in analysis: ${move}`);
          engine.terminate();
          reject(new Error(`Invalid move: ${move}`));
          return;
        }

        const fenAfter = chess.fen();

        // Get evaluation for the position
        engine.postMessage('uci');
        engine.postMessage(`position fen ${fenBefore}`);
        engine.postMessage('go depth 12'); // Fast analysis depth

        let bestMove = '';
        let score = 0;

        const onMessage = (line) => {
          if (line.startsWith('info depth') && line.includes('score cp')) {
            const parts = line.split(' ');
            const scoreIdx = parts.indexOf('cp');
            if (scoreIdx !== -1) {
              score = parseInt(parts[scoreIdx + 1]);
            }
          } else if (line.startsWith('bestmove')) {
            bestMove = line.split(' ')[1];
            
            // Simplified classification logic
            // In a real app, we'd compare the move played with the engine's top choices
            // For now, let's categorize based on a simple heuristic or mark as "Analyzed"
            const moveAnalysis = {
              move,
              bestMove,
              type: this._classifyMove(score), // Placeholder classification
              comment: this._getComment(score)
            };

            analysis.moves.push(moveAnalysis);
            this._updateSummary(analysis.summary, moveAnalysis.type);
            
            currentMoveIndex++;
            engine.removeAllListeners('message');
            runAnalysis();
          }
        };

        engine.onmessage = onMessage;
      };

      runAnalysis();
    });
  }

  _classifyMove(score) {
    const absScore = Math.abs(score);
    if (absScore < 50) return 'Best Move';
    if (absScore < 100) return 'Excellent';
    if (absScore < 200) return 'Good';
    if (absScore < 400) return 'Inaccuracy';
    if (absScore < 800) return 'Mistake';
    return 'Blunder';
  }

  _getComment(score) {
    const type = this._classifyMove(score);
    switch (type) {
      case 'Best Move': return 'Excellent play';
      case 'Excellent': return 'Very strong move';
      case 'Good': return 'Solid choice';
      case 'Inaccuracy': return 'Slightly inaccurate';
      case 'Mistake': return 'A noticeable mistake';
      case 'Blunder': return 'Critical error';
      default: return '';
    }
  }

  _updateSummary(summary, type) {
    const key = type.toLowerCase().replace(' ', '');
    if (summary.hasOwnProperty(key)) {
      summary[key]++;
    }
  }
}

module.exports = new AnalysisService();
