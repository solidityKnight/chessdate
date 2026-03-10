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
  file:             number;
  rank:             number;
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
  const square  = coordsToSquare(file, rank);
  const isLight = isLightSquare(file, rank);

  // Labels appear on the edge closest to each player.
  const showRankLabel = flipped ? file === 7 : file === 0;
  const showFileLabel = flipped ? rank === 7 : rank === 0;
  const rankLabel     = String(rank + 1);
  const fileLabel     = String.fromCharCode(97 + file);

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

  // Depend on the full currentGame object — ESLint requires this when the
  // memo body accesses currentGame properties via optional chaining.
  const board = useMemo(
    () => (currentGame ? parseFEN(currentGame.board) : null),
    [currentGame],
  );

  const lastMove = currentGame?.moves?.at(-1);
  const lastMoveSquares = useMemo(
    () => (lastMove ? new Set([lastMove.from, lastMove.to]) : new Set<string>()),
    [lastMove],
  );

  /*
   * FIX: use [currentGame, board] as deps — not the nested optional-chain
   * variants.  The rule requires every value *read inside the callback* to
   * appear in the array.  currentGame and board are the only two; the nested
   * property accesses (gameStatus, board string) are reads on those same
   * objects, not separate dependency values.
   */
  const checkSquare = useMemo(() => {
    if (!currentGame || !board) return null;
    const gs   = currentGame.gameStatus;
    const turn = currentGame.board.split(' ')[1];
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
  }, [currentGame, board]);

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
          const logicalRank = flipped ? gridRow : 7 - gridRow;

          return Array.from({ length: 8 }, (_, gridCol) => {
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