// Chess utilities and helper functions

export const BOARD_SIZE = 8;
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export type FileChar  = typeof FILES[number];
export type RankChar  = typeof RANKS[number];
export type Square    = string; // e.g. 'e4'
export type FenChar   = 'p'|'r'|'n'|'b'|'q'|'k'|'P'|'R'|'N'|'B'|'Q'|'K';
export type PieceColor = 'white' | 'black';

// ─── Coordinate / square conversion ──────────────────────────────────────────

/**
 * Convert algebraic square notation to zero-based [file, rank] coordinates.
 * file 0 = 'a', rank 0 = '1' (bottom of board in White's orientation).
 *
 * BUG FIX: the original parsed rank with `parseInt(square[1]) - 1`.
 * `parseInt` is permissive — it silently accepts and truncates strings like
 * '4x' or '4.9'.  Now validated strictly before conversion.
 *
 * @example squareToCoords('e4') → { file: 4, rank: 3 }
 */
export const squareToCoords = (square: string): { file: number; rank: number } => {
  if (!isValidSquare(square)) {
    throw new RangeError(`squareToCoords: invalid square "${square}"`);
  }
  const file = square.charCodeAt(0) - 97; // 'a'.charCodeAt(0)
  const rank = Number(square[1]) - 1;
  return { file, rank };
};

/**
 * Convert zero-based coordinates to algebraic square notation.
 *
 * BUG FIX: the original used array lookups on FILES/RANKS without bounds
 * checking, returning `undefined` (coerced to the string "undefined") for
 * out-of-range values.  Now throws a descriptive error instead.
 *
 * @example coordsToSquare(4, 3) → 'e4'
 */
export const coordsToSquare = (file: number, rank: number): string => {
  if (file < 0 || file >= BOARD_SIZE || rank < 0 || rank >= BOARD_SIZE) {
    throw new RangeError(
      `coordsToSquare: coordinates (${file}, ${rank}) are out of range`,
    );
  }
  return `${FILES[file]}${RANKS[rank]}`;
};

/**
 * Return true when `square` is a syntactically and semantically valid
 * algebraic square (two characters: file a–h, rank 1–8).
 */
export const isValidSquare = (square: string): boolean => {
  if (typeof square !== 'string' || square.length !== 2) return false;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return (
    file >= 0 && file < BOARD_SIZE &&
    Number.isInteger(rank) && rank >= 1 && rank <= BOARD_SIZE
  );
};

// ─── Square colour ────────────────────────────────────────────────────────────

/**
 * Return true when the square at (file, rank) is a light square.
 *
 * BUG FIX: the original returned `(file + rank) % 2 === 0`, which labels
 * a1 (file 0, rank 0) as light.  In standard chess a1 is a DARK square.
 * The correct parity is `(file + rank) % 2 !== 0`.
 */
export const isLightSquare = (file: number, rank: number): boolean => {
  return (file + rank) % 2 !== 0;
};

// ─── Piece symbols ────────────────────────────────────────────────────────────

const PIECE_SYMBOLS: Readonly<Record<FenChar, string>> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
} as const;

/**
 * Return the Unicode chess symbol for a FEN piece character, or '' for empty.
 *
 * BUG FIX: the original reconstructed the lookup object on every call.
 * Hoisted to a module-level constant so it is built exactly once.
 */
export const getPieceSymbol = (fenChar: string): string =>
  PIECE_SYMBOLS[fenChar as FenChar] ?? '';

/**
 * Return the display colour of a piece from its FEN character.
 * Uppercase = white, lowercase = black.
 */
export const getPieceColor = (fenChar: string): PieceColor =>
  fenChar === fenChar.toUpperCase() ? 'white' : 'black';

// ─── FEN parsing ──────────────────────────────────────────────────────────────

/**
 * Parse the piece-placement section of a FEN string into an 8×8 board array.
 *
 * board[rank][file] — rank 0 = rank 1 (White's back rank),
 *                     rank 7 = rank 8 (Black's back rank).
 * Empty squares are represented as null (not '').
 *
 * BUG FIX: the original used '' for empty squares, causing truthy checks like
 * `if (piece)` to correctly skip empty squares — but only by accident.
 * Switched to null so the intent is explicit and type-safe.
 *
 * BUG FIX: the original did not validate the FEN segment at all.  If `fen`
 * was undefined, null, or a malformed string, it would throw an unreadable
 * runtime error deep inside the loop.  Now validates the argument and throws
 * a clear error.
 *
 * BUG FIX: the original started at rank 7 and decremented, which is correct
 * for FEN (which starts at rank 8, i.e. index 7).  However, it used a mutable
 * `file` variable that was reset to 0 on '/' — a pattern that silently
 * produced wrong results if the FEN had more or fewer than 8 files per rank
 * (e.g. due to corruption).  Added a post-rank assertion in dev/test mode.
 *
 * @returns board[rank][file] where null = empty square.
 */
export const parseFEN = (fen: string): (string | null)[][] => {
  if (typeof fen !== 'string' || !fen.trim()) {
    throw new TypeError(`parseFEN: expected a non-empty FEN string, got ${JSON.stringify(fen)}`);
  }

  const [position] = fen.split(' ');
  const ranks = position.split('/');

  if (ranks.length !== BOARD_SIZE) {
    throw new RangeError(
      `parseFEN: expected ${BOARD_SIZE} rank segments, got ${ranks.length}`,
    );
  }

  // board[0] = rank 1 (White's first rank), board[7] = rank 8.
  // FEN rank segments are ordered 8→1, so we reverse.
  const board: (string | null)[][] = ranks
    .slice()
    .reverse()
    .map((rankStr, rankIndex) => {
      const row: (string | null)[] = [];

      for (const char of rankStr) {
        if (/\d/.test(char)) {
          const empty = Number(char);
          for (let i = 0; i < empty; i++) row.push(null);
        } else {
          row.push(char);
        }
      }

      if (row.length !== BOARD_SIZE) {
        throw new RangeError(
          `parseFEN: rank ${rankIndex + 1} has ${row.length} squares, expected ${BOARD_SIZE}`,
        );
      }

      return row;
    });

  return board;
};

/**
 * Extract the active colour from a FEN string.
 * Returns 'white' | 'black', or throws for malformed input.
 */
export const getActiveColor = (fen: string): PieceColor => {
  const turn = fen.split(' ')[1];
  if (turn === 'w') return 'white';
  if (turn === 'b') return 'black';
  throw new RangeError(`getActiveColor: unexpected turn token "${turn}" in FEN`);
};

// ─── Turn helpers ─────────────────────────────────────────────────────────────

/**
 * Return true when it is `playerColor`'s turn to move.
 */
export const isPlayerTurn = (fen: string, playerColor: PieceColor): boolean =>
  getActiveColor(fen) === playerColor;

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a Unix-millisecond timestamp as a short HH:MM time string.
 */
export const formatTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Return a human-readable game-result message.
 *
 * BUG FIX: the original had no `default` fallthrough for draw sub-types
 * ('insufficient_material', 'threefold_repetition', etc.) — they would fall
 * through to the generic 'Game ended' branch and lose context.  Added
 * explicit cases for all draw reasons produced by the server.
 */
export const getGameResultMessage = (result: string, winner?: string): string => {
  const winnerName = winner === 'white' ? 'White' : 'Black';

  switch (result) {
    case 'checkmate':
      return winner
        ? `${winnerName} wins by checkmate!`
        : 'Game ended by checkmate';

    case 'resignation':
      return winner
        ? `${winnerName} wins by resignation!`
        : 'Game ended by resignation';

    case 'disconnect':
      return winner
        ? `${winnerName} wins — opponent disconnected`
        : 'Game ended by disconnect';

    case 'stalemate':
      return 'Draw — stalemate';

    case 'insufficient_material':
      return 'Draw — insufficient material';

    case 'threefold_repetition':
      return 'Draw — threefold repetition';

    case 'fifty_move_rule_or_agreement':
      return 'Draw — fifty-move rule';

    // Generic draw catch-all (e.g. server sends 'draw' without a sub-reason).
    case 'draw':
      return 'Game ended in a draw';

    default:
      return 'Game over';
  }
};