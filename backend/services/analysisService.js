const { Chess } = require('chess.js');
const path = require('path');
const fs = require('fs');

class AnalysisService {
  constructor() {
    this.engine = null;
    this._stockfishFactory = null;
  }

  /**
   * Lazy load Stockfish to prevent server crash on startup
   */
  async _getEngine() {
    if (!this._stockfishFactory) {
      try {
        // We use the 'stockfish' package's bin file directly for Node.js
        const factoryPath = path.join(__dirname, '..', 'node_modules', 'stockfish', 'bin', 'stockfish-18.js');
        if (!fs.existsSync(factoryPath)) {
          throw new Error(`Stockfish engine not found at ${factoryPath}`);
        }
        
        // Railway Fix: Prevent Stockfish.js from crashing in Node 18+
        // It tries to fetch('stockfish.wasm') which fails with ERR_INVALID_URL in Node.
        if (typeof fetch === 'function' && !global.XMLHttpRequest) {
          const oldFetch = global.fetch;
          global.fetch = async (url, options) => {
            if (typeof url === 'string' && url.includes('stockfish')) {
              const wasmPath = path.join(__dirname, '..', 'node_modules', 'stockfish', 'bin', 'stockfish-18.wasm');
              if (fs.existsSync(wasmPath)) {
                const buffer = fs.readFileSync(wasmPath);
                return {
                  ok: true,
                  status: 200,
                  arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                  blob: async () => new Blob([buffer])
                };
              }
            }
            return oldFetch(url, options);
          };
        }

        this._stockfishFactory = require(factoryPath);
      } catch (err) {
        console.error('❌ Failed to load Stockfish factory:', err);
        throw err;
      }
    }
    
    // In stockfish v18, the factory returns a promise that resolves to the module
    const engine = await this._stockfishFactory();
    
    // Polyfill postMessage/onmessage if they don't exist
    if (typeof engine.postMessage !== 'function') {
      // In Node.js environment, the Emscripten module might be used directly
      // but usually the bin/stockfish-18.js wrapper handles it.
      // If not, we can provide a basic bridge to the UCI interface.
    }
    
    return engine;
  }

  /**
   * Analyze a complete game history
   * @param {string[]} moves - Array of moves in SAN or LAN
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeGame(moves) {
    try {
      const engine = await this._getEngine();
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

      const totalMoves = moves.length;
      let totalEvalDiff = 0;

      for (let i = 0; i < totalMoves; i++) {
        const move = moves[i];
        const fenBefore = chess.fen();
        
        try {
          chess.move(move);
        } catch (e) {
          console.error(`Invalid move in analysis: ${move}`);
          break;
        }

        const score = await this._getEvaluation(engine, fenBefore);
        const bestMove = await this._getBestMove(engine, fenBefore);

        const moveAnalysis = {
          move,
          bestMove,
          type: this._classifyMove(score),
          comment: this._getComment(score)
        };

        analysis.moves.push(moveAnalysis);
        this._updateSummary(analysis.summary, moveAnalysis.type);
      }

      const avgLoss = totalMoves > 0 ? totalEvalDiff / totalMoves : 0;
      analysis.accuracy = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-0.004 * avgLoss))));
      
      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  async _getEvaluation(engine, fen) {
    return new Promise((resolve) => {
      let score = 0;
      const onMessage = (line) => {
        if (line.startsWith('info depth') && line.includes('score cp')) {
          const parts = line.split(' ');
          const scoreIdx = parts.indexOf('cp');
          if (scoreIdx !== -1) score = parseInt(parts[scoreIdx + 1]);
        } else if (line.startsWith('bestmove')) {
          engine.removeMessageListener(onMessage);
          resolve(score);
        }
      };
      engine.addMessageListener(onMessage);
      engine.postMessage(`position fen ${fen}`);
      engine.postMessage('go depth 10');
    });
  }

  async _getBestMove(engine, fen) {
    return new Promise((resolve) => {
      const onMessage = (line) => {
        if (line.startsWith('bestmove')) {
          engine.removeMessageListener(onMessage);
          resolve(line.split(' ')[1]);
        }
      };
      engine.addMessageListener(onMessage);
      engine.postMessage(`position fen ${fen}`);
      engine.postMessage('go depth 10');
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
