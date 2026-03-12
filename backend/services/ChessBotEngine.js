'use strict';

const { Chess } = require('chess.js');

// ─── Piece values (centipawns) ─────────────────────────────────────────────
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// ─── Piece-square tables (from white's perspective, index 0 = a8) ──────────
// Values will be mirrored for black pieces.

const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

// ─── Difficulty configs ────────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  easy:         { depth: 1, blunderChance: 0.40 },
  medium:       { depth: 2, blunderChance: 0.20 },
  hard:         { depth: 3, blunderChance: 0.05 },
  superhard:    { depth: 4, blunderChance: 0.02 },
  extremehard:  { depth: 4, blunderChance: 0.00 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert a board square (e.g. { type: 'p', color: 'w' }) to a PST index.
 * chess.js board() returns an 8×8 array where [0][0] = a8, [7][7] = h1.
 */
function getPstIndex(row, col, isWhite) {
  // White uses the table as-is; black mirrors vertically.
  return isWhite ? row * 8 + col : (7 - row) * 8 + col;
}

/**
 * Evaluate a position from white's perspective in centipawns.
 */
function evaluate(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let score = 0;
  const board = chess.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const isWhite = piece.color === 'w';
      const pstIdx = getPstIndex(row, col, isWhite);
      const materialVal = PIECE_VALUES[piece.type] || 0;
      const positionalVal = (PST[piece.type] || [])[pstIdx] || 0;
      const value = materialVal + positionalVal;

      score += isWhite ? value : -value;
    }
  }

  return score;
}

/**
 * Minimax with alpha-beta pruning.
 */
function minimax(chess, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess);
  }

  const moves = chess.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

class ChessBotEngine {

  /**
   * Evaluate a FEN position from white's perspective.
   * @param {string} fen
   * @returns {number} centipawn score
   */
  evaluate(fen) {
    const chess = new Chess();
    chess.load(fen);
    return evaluate(chess);
  }

  /**
   * Pick the best move for the given difficulty.
   * @param {string} fen
   * @param {string} difficulty  one of: easy, medium, hard, superhard, extremehard
   * @returns {{ from: string, to: string, promotion?: string, san: string } | null}
   */
  getBestMove(fen, difficulty = 'medium') {
    const chess = new Chess();
    chess.load(fen);

    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

    // Blunder: pick a random legal move
    if (Math.random() < config.blunderChance) {
      const rnd = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return { from: rnd.from, to: rnd.to, promotion: rnd.promotion || undefined, san: rnd.san };
    }

    const isMaximizing = chess.turn() === 'w';
    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Shuffle to add variety when scores are equal
    const shuffled = [...legalMoves].sort(() => Math.random() - 0.5);

    for (const move of shuffled) {
      chess.move(move);
      const score = minimax(chess, config.depth - 1, -Infinity, Infinity, !isMaximizing);
      chess.undo();

      if (isMaximizing ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (!bestMove) {
      bestMove = legalMoves[0];
    }

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || undefined,
      san: bestMove.san,
    };
  }

  /**
   * Classify how "strong" the player's move was by comparing eval before and after.
   * @param {string} fenBefore  FEN before the player's move
   * @param {string} fenAfter   FEN after the player's move
   * @returns {'normal'|'strong'|'blunder'}
   */
  classifyPlayerMove(fenBefore, fenAfter) {
    const evalBefore = this.evaluate(fenBefore);
    const evalAfter  = this.evaluate(fenAfter);

    // Positive swing = good for white, negative = good for black
    const swing = Math.abs(evalAfter - evalBefore);

    if (swing > 200) return 'strong';  // significant eval swing
    if (swing > 400) return 'blunder'; // probably a blunder by one side
    return 'normal';
  }

  /**
   * Determine whether the bot (given its color) is winning, losing, or equal.
   * @param {string} fen
   * @param {'white'|'black'} botColor
   * @returns {'winning'|'losing'|'equal'}
   */
  getGameStatus(fen, botColor) {
    const score = this.evaluate(fen);
    const adjustedScore = botColor === 'white' ? score : -score;

    if (adjustedScore > 150) return 'winning';
    if (adjustedScore < -150) return 'losing';
    return 'equal';
  }
}

module.exports = new ChessBotEngine();
