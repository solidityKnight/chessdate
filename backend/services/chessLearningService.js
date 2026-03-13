const { Chess } = require('chess.js');

class ChessLearningService {
  constructor() {
    this.TACTICS = {
      FORK: {
        type: 'fork',
        message: 'Great move!',
        explanation: 'You created a fork. A fork attacks two or more pieces at once.'
      },
      PIN: {
        type: 'pin',
        message: 'Nice tactic!',
        explanation: 'You created a pin. The pinned piece cannot move without exposing a stronger piece.'
      },
      SKEWER: {
        type: 'skewer',
        message: 'Skewer detected!',
        explanation: 'You attacked a valuable piece, forcing it to move and exposing another piece behind it.'
      },
      CHECK: {
        type: 'check',
        message: 'Check!',
        explanation: 'You put the opponent king in check. They must respond immediately.'
      },
      CHECKMATE: {
        type: 'checkmate',
        message: 'Checkmate!',
        explanation: 'The king has no legal moves and cannot escape attack. Game over!'
      },
      HANGING: {
        type: 'hanging',
        message: 'Opportunity!',
        explanation: 'That piece is undefended. You can capture it!'
      },
      CAPTURE: {
        type: 'capture',
        message: 'Nice capture!',
        explanation: 'You gained material advantage.'
      }
    };
  }

  /**
   * Detect tactical patterns after a move
   * @param {string} fenBefore - Board state before move
   * @param {Object} move - The move performed (from chess.js)
   * @param {string} fenAfter - Board state after move
   * @returns {Object|null} Tip data if a tactic is detected
   */
  detectTactic(fenBefore, move, fenAfter) {
    const chess = new Chess(fenAfter);
    const turn = move.color; // 'w' or 'b'
    const opponentTurn = turn === 'w' ? 'b' : 'w';

    // 1. Checkmate
    if (chess.isCheckmate()) {
      return this.TACTICS.CHECKMATE;
    }

    // 2. Check
    if (chess.isCheck()) {
      return this.TACTICS.CHECK;
    }

    // 3. Fork detection (simplified)
    // A piece is attacking 2 or more valuable pieces
    if (this._isFork(chess, move)) {
      return this.TACTICS.FORK;
    }

    // 4. Capture
    if (move.captured) {
      // Check if it's a "Good Capture" (gaining material)
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      const capturedVal = pieceValues[move.captured];
      const attackerVal = pieceValues[move.piece];
      
      if (capturedVal >= attackerVal || !this._isDefended(chess, move.to)) {
        return this.TACTICS.CAPTURE;
      }
    }

    // 5. Hanging Piece (opponent's pieces after our move)
    const hangingPiece = this._findHangingPiece(chess, opponentTurn);
    if (hangingPiece) {
      return {
        ...this.TACTICS.HANGING,
        explanation: `The ${hangingPiece} at ${hangingPiece.square} is undefended. You can capture it!`
      };
    }

    // 6. Pin/Skewer (simplified logic)
    if (['b', 'r', 'q'].includes(move.piece)) {
      if (this._isPinOrSkewer(chess, move)) {
        // Distinguish between pin and skewer could be complex, using generic tactic or pin for now
        return this.TACTICS.PIN;
      }
    }

    return null;
  }

  _isFork(chess, move) {
    const square = move.to;
    const piece = chess.get(square);
    if (!piece) return false;

    // Get all squares this piece attacks
    const attacks = this._getAttackedSquares(chess, square);
    let highValueTargets = 0;

    for (const targetSquare of attacks) {
      const targetPiece = chess.get(targetSquare);
      if (targetPiece && targetPiece.color !== piece.color) {
        // If it's a more valuable piece or undefended
        if (['q', 'r', 'b', 'n'].includes(targetPiece.type)) {
          highValueTargets++;
        }
      }
    }

    return highValueTargets >= 2;
  }

  _isPinOrSkewer(chess, move) {
    // Simplified: if a sliding piece is attacking through one piece to another
    // This usually requires engine-level raycasting or complex chess.js logic
    // For now, return false unless we implement a proper raycaster
    return false;
  }

  _isDefended(chess, square) {
    const piece = chess.get(square);
    if (!piece) return false;
    
    // Switch turn to check if own pieces "attack" this square
    const originalFen = chess.fen();
    const fenParts = originalFen.split(' ');
    fenParts[1] = piece.color === 'w' ? 'b' : 'w'; // Fake turn
    const fakeChess = new Chess(fenParts.join(' '));
    
    return fakeChess.attackers(square).length > 0;
  }

  _findHangingPiece(chess, color) {
    // Find pieces of 'color' that are attacked by opponent but not defended
    const squares = this._getAllSquares();
    for (const square of squares) {
      const piece = chess.get(square);
      if (piece && piece.color === color) {
        const attackers = chess.attackers(square);
        if (attackers.length > 0 && !this._isDefended(chess, square)) {
          return { type: piece.type, square };
        }
      }
    }
    return null;
  }

  _getAttackedSquares(chess, square) {
    // chess.js attackers() works for who is attacking a square.
    // To see what a square attacks, we move there and see what we can take.
    // Or we use a temporary board.
    const moves = chess.moves({ square, verbose: true });
    return moves.map(m => m.to);
  }

  _getAllSquares() {
    const squares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        squares.push(String.fromCharCode(97 + j) + (i + 1));
      }
    }
    return squares;
  }
}

module.exports = new ChessLearningService();
