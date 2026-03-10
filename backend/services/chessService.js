'use strict';

const { Chess } = require('chess.js');

/**
 * ChessService — stateless helper wrapping chess.js.
 *
 * Every public method accepts a FEN string so it is safe to call
 * concurrently from multiple requests without shared mutable state.
 * The singleton `this.chess` instance that existed in the original has
 * been removed — it was never used and would have caused race conditions
 * in async environments.
 */
class ChessService {
  // ─── Internal helpers ────────────────────────────────────────────────────

  /**
   * Build a Chess instance from a FEN string.
   * Throws a descriptive error when the FEN is invalid so callers get a
   * useful message instead of a cryptic chess.js internal error.
   *
   * BUG FIX: chess.js 1.0.0 throws on invalid FEN, so we wrap in try-catch.
   *
   * @param {string} fen
   * @returns {Chess}
   */
  _fromFen(fen) {
    try {
      const chess = new Chess();
      chess.load(fen);
      return chess;
    } catch (err) {
      throw new Error(`Invalid FEN: "${fen}" - ${err.message}`);
    }
  }

  /**
   * Derive a detailed draw reason from a Chess instance that has already
   * been confirmed to be a draw via chess.isDraw().
   *
   * chess.js collapses all draw conditions into isDraw(); the individual
   * helpers (isInsufficientMaterial, isThreefoldRepetition, …) still work
   * in parallel, so we interrogate them to produce a specific reason.
   *
   * @param {Chess} chess
   * @returns {string}
   */
  _drawReason(chess) {
    if (chess.isInsufficientMaterial()) return 'insufficient_material';
    if (chess.isThreefoldRepetition())  return 'threefold_repetition';
    if (chess.isStalemate())            return 'stalemate';
    // Fifty-move rule — chess.js does not expose a dedicated helper but
    // isDraw() covers it; label it generically.
    return 'fifty_move_rule_or_agreement';
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Validate and apply a move.
   *
   * @param {string}      fen
   * @param {string}      from        e.g. 'e2'
   * @param {string}      to          e.g. 'e4'
   * @param {string|null} [promotion] 'q' | 'r' | 'b' | 'n'
   * @returns {{
   *   valid: boolean,
   *   move?: object,
   *   newFen?: string,
   *   isGameOver?: boolean,
   *   isCheck?: boolean,
   *   isCheckmate?: boolean,
   *   isDraw?: boolean,
   *   isStalemate?: boolean,
   *   error?: string
   * }}
   */
  validateMove(fen, from, to, promotion = null) {
    try {
      const chess = this._fromFen(fen);

      const moveOpts = { from, to };
      if (promotion) moveOpts.promotion = promotion.toLowerCase();

      const move = chess.move(moveOpts);

      // chess.js returns null (not throws) for an illegal move.
      if (!move) {
        return { valid: false, error: 'Illegal move' };
      }

      return {
        valid:       true,
        move,
        newFen:      chess.fen(),
        isGameOver:  chess.isGameOver(),
        isCheck:     chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isDraw:      chess.isDraw(),
        isStalemate: chess.isStalemate(),
      };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  /**
   * Return all legal moves for a given square.
   *
   * @param {string} fen
   * @param {string} square  e.g. 'e2'
   * @returns {object[]}  Verbose move objects, or [] on error.
   */
  getPossibleMoves(fen, square) {
    try {
      const chess = this._fromFen(fen);
      return chess.moves({ square, verbose: true });
    } catch (err) {
      console.error('getPossibleMoves error:', err.message);
      return [];
    }
  }

  /**
   * Return all legal moves for the side to move.
   *
   * @param {string} fen
   * @returns {object[]}
   */
  getAllMoves(fen) {
    try {
      return this._fromFen(fen).moves({ verbose: true });
    } catch (err) {
      console.error('getAllMoves error:', err.message);
      return [];
    }
  }

  /**
   * Return whether the position is in check.
   *
   * @param {string} fen
   * @returns {boolean}
   */
  isInCheck(fen) {
    try {
      return this._fromFen(fen).inCheck();
    } catch {
      return false;
    }
  }

  /**
   * Return a structured game-status object.
   *
   * BUG FIX: the original code tested isStalemate / isInsufficientMaterial
   * *after* isDraw, but isDraw() already returns true for those conditions —
   * so those branches could never be reached.  The corrected version checks
   * the specific conditions *before* the generic isDraw guard.
   *
   * @param {string} fen
   * @returns {{
   *   status: 'active'|'check'|'checkmate'|'stalemate'|'draw'|'error',
   *   winner?: 'white'|'black',
   *   reason?: string
   * }}
   */
  getGameStatus(fen) {
    try {
      const chess = this._fromFen(fen);

      if (chess.isCheckmate()) {
        return {
          status: 'checkmate',
          // The side that just moved delivered mate; chess.turn() is the
          // *losing* side (it is now their turn but they have no legal move).
          winner: chess.turn() === 'w' ? 'black' : 'white',
        };
      }

      // Check stalemate and insufficient-material before the generic isDraw
      // guard so we can attach a precise reason.
      if (chess.isStalemate()) {
        return { status: 'stalemate' };
      }

      if (chess.isInsufficientMaterial()) {
        return { status: 'draw', reason: 'insufficient_material' };
      }

      if (chess.isThreefoldRepetition()) {
        return { status: 'draw', reason: 'threefold_repetition' };
      }

      // Catch-all for fifty-move rule and any other draw conditions.
      if (chess.isDraw()) {
        return { status: 'draw', reason: this._drawReason(chess) };
      }

      // Not game-over — surface check as a distinct status.
      if (chess.inCheck()) {
        return { status: 'check' };
      }

      return { status: 'active' };
    } catch (err) {
      console.error('getGameStatus error:', err.message);
      return { status: 'error', reason: err.message };
    }
  }

  /**
   * Convert a from/to move into Standard Algebraic Notation.
   *
   * @param {string}      fen
   * @param {string}      from
   * @param {string}      to
   * @param {string|null} [promotion]
   * @returns {string|null}  SAN string, or null if the move is illegal.
   */
  moveToAlgebraic(fen, from, to, promotion = null) {
    try {
      const chess = this._fromFen(fen);
      const moveOpts = { from, to };
      if (promotion) moveOpts.promotion = promotion.toLowerCase();
      const move = chess.move(moveOpts);
      return move ? move.san : null;
    } catch {
      return null;
    }
  }

  /**
   * Return the FEN for the standard starting position.
   *
   * @returns {string}
   */
  getInitialFen() {
    return new Chess().fen();
  }

  /**
   * Convenience factory — returns a new Chess instance.
   * Prefer calling _fromFen() internally; expose this for callers that need
   * raw chess.js access (e.g. engine integrations).
   *
   * @param {string|null} [fen]
   * @returns {Chess}
   */
  createChess(fen = null) {
    return fen ? this._fromFen(fen) : new Chess();
  }
}

module.exports = new ChessService();