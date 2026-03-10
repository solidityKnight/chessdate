import React, { useCallback, useMemo } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import {
  parseFEN,
  isLightSquare,
  getPieceSymbol,
  getPieceColor,
  coordsToSquare,
} from '../utils/chessHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SquareProps {
  file:             number;   // logical file  0–7 (a–h), used for square name + colour
  rank:             number;   // logical rank  0–7 (1–8), used for square name + colour
  piece:            string | null;
  isSelected:       boolean;
  isPossibleMove:   boolean;
  isLastMoveSquare: boolean;
  isInCheck:        boolean;
  showCoords:       boolean;
  flipped:          boolean;
  onClick:          (square: string) => void;
}

// ─── Square ───────────────────────────────────────────────────────────────────

const Square = React.memo<SquareProps>(({
  file, rank, piece,
  isSelected, isPossibleMove, isLastMoveSquare, isInCheck,
  showCoords, flipped, onClick,
}) => {
  const square  = coordsToSquare(file, rank);   // always uses logical coords
  const isLight = isLightSquare(file, rank);

  /*
   * Coordinate labels appear on the board edge closest to each player.
   * For White (unflipped): rank label on file 0 (left edge), file label on rank 0 (bottom edge).
   * For Black (flipped):   rank label on file 7 (now the left edge), file label on rank 7 (now bottom).
   *
   * BUG FIX: previously these used the raw grid-position index, which was
   * already the logical index — so this was accidentally correct for White
   * but wrong for Black because the grid positions were reversed while the
   * label-visibility check still referenced the unflipped edge.
   * Now both cases are explicit.
   */
  const showRankLabel = flipped ? file === 7 : file === 0;
  const showFileLabel = flipped ? rank === 7 : rank === 0;

  // Rank label text: logical rank number (1-based).
  const rankLabel = String(rank + 1);   // rank 0 → '1', rank 7 → '8'
  // File label text: logical file letter.
  const fileLabel = String.fromCharCode(97 + file);  // 0 → 'a', 7 → 'h'

  const handleClick = useCallback(() => onClick(square), [onClick, square]);

  const pieceColorClass = piece ? `piece--${getPieceColor(piece)}` : '';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${square}${piece ? `, ${piece}` : ''}${isSelected ? ', selected' : ''}${isPossibleMove ? ', possible move' : ''}`}
      aria-pressed={isSelected}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      onClick={handleClick}
      className={[
        'chess-square',
        isLight          ? 'light'         : 'dark',
        isSelected       ? 'selected'      : '',
        isPossibleMove   ? 'possible-move' : '',
        isLastMoveSquare ? 'last-move'     : '',
        isInCheck        ? 'in-check'      : '',
      ].filter(Boolean).join(' ')}
    >
      {showCoords && showRankLabel && (
        <span className="coord-label rank-label" aria-hidden="true">{rankLabel}</span>
      )}
      {showCoords && showFileLabel && (
        <span className="coord-label file-label" aria-hidden="true">{fileLabel}</span>
      )}

      {isPossibleMove && (
        <span className={piece ? 'capture-ring' : 'move-dot'} aria-hidden="true" />
      )}

      {piece && (
        <span className={`piece ${pieceColorClass}`} aria-hidden="true">
          {getPieceSymbol(piece)}
        </span>
      )}
    </div>
  );
});

Square.displayName = 'Square';

// ─── ChessBoard ───────────────────────────────────────────────────────────────

const ChessBoard: React.FC = () => {
  const {
    currentGame,
    playerColor,
    selectedSquare,
    possibleMoves,
    isLoadingMoves,
    selectSquare,
  } = useChessGame();

  const flipped = playerColor === 'black';

  const board = useMemo(
    () => (currentGame ? parseFEN(currentGame.board) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGame?.board],
  );

  const lastMove        = currentGame?.moves?.at(-1);
  const lastMoveSquares = useMemo(
    () => (lastMove ? new Set([lastMove.from, lastMove.to]) : new Set<string>()),
    [lastMove],
  );

  const checkSquare = useMemo(() => {
    if (!currentGame || !board) return null;
    const gs   = currentGame.gameStatus;
    const turn = currentGame.board?.split(' ')[1];
    if (gs?.status !== 'check' && gs?.status !== 'checkmate') return null;

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.toLowerCase() !== 'k') continue;
        const isWhiteKing = p === 'K';
        if ((turn === 'w' && isWhiteKing) || (turn === 'b' && !isWhiteKing)) {
          return coordsToSquare(f, r);
        }
      }
    }
    return null;
  }, [currentGame?.gameStatus?.status, currentGame?.board, board]);

  // ─── Empty / error states ─────────────────────────────────────────────────

  if (!currentGame) {
    return (
      <div className="board-placeholder" role="status" aria-live="polite">
        <div className="board-placeholder__spinner" aria-hidden="true" />
        <p>Waiting for game to start…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="board-placeholder" role="alert">
        <p>Unable to parse board position.</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  /*
   * BUG FIX: the original used INDICES / INDICES_REV as both the grid
   * iteration order AND the logical board index passed to Square.  When
   * flipped, rankIndex would be 7,6,5…0 and fileIndex 7,6,5…0 — so
   * coordsToSquare(fileIndex, rankIndex) inside Square would produce h8,
   * g8… for the top-left grid cell instead of a1 (as Black sees it).
   *
   * The grid must always render 8×8 cells top-to-bottom, left-to-right
   * (grid positions 0–7).  What changes when flipped is which LOGICAL square
   * maps to each grid position:
   *
   *   Unflipped: grid row 0 = rank 7 (rank '8'), grid col 0 = file 0 ('a')
   *   Flipped:   grid row 0 = rank 0 (rank '1'), grid col 0 = file 7 ('h')
   *
   * So we always iterate gridRow / gridCol from 0→7 and derive the logical
   * rank / file from the flip state.
   */
  return (
    <div
      className={['chess-board-wrapper', flipped ? 'flipped' : ''].filter(Boolean).join(' ')}
      aria-label="Chess board"
    >
      {isLoadingMoves && (
        <div className="board-overlay" aria-live="polite" aria-label="Loading possible moves" />
      )}

      <div className="chess-board" role="grid" aria-label="Chess board">
        {Array.from({ length: 8 }, (_, gridRow) => {
          // Logical rank: unflipped = row 0 is rank 7 (top of board = rank 8)
          //               flipped   = row 0 is rank 0 (top of board = rank 1)
          const logicalRank = flipped ? gridRow : 7 - gridRow;

          return Array.from({ length: 8 }, (_, gridCol) => {
            // Logical file: unflipped = col 0 is file 0 ('a')
            //               flipped   = col 0 is file 7 ('h')
            const logicalFile = flipped ? 7 - gridCol : gridCol;

            const square     = coordsToSquare(logicalFile, logicalRank);
            const piece      = board[logicalRank][logicalFile];
            const isPossible = possibleMoves.includes(square);
            const isLastMove = lastMoveSquares.has(square);
            const isChecked  = checkSquare === square;

            return (
              <Square
                key={square}
                file={logicalFile}
                rank={logicalRank}
                piece={piece}
                isSelected={selectedSquare === square}
                isPossibleMove={isPossible}
                isLastMoveSquare={isLastMove}
                isInCheck={isChecked}
                showCoords={true}
                flipped={flipped}
                onClick={selectSquare}
              />
            );
          });
        })}
      </div>
    </div>
  );
};

export default ChessBoard;