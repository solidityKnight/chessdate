import React, { useMemo } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../store/gameStore';
import { coordsToSquare, getPieceSymbol, isLightSquare, parseFEN } from '../utils/chessHelpers';

type RomanticChessboardProps = {
  interactive?: boolean;
  showHeartGlow?: boolean;
};

const RomanticChessboard: React.FC<RomanticChessboardProps> = ({ interactive = true, showHeartGlow = true }) => {
  const currentGame = useGameStore((s) => s.currentGame);
  const { selectSquare } = useChessGame();
  const flipped = currentGame?.playerColor === 'black';

  const board = useMemo(() => {
    if (!currentGame?.board) return null;
    try {
      return parseFEN(currentGame.board);
    } catch {
      return null;
    }
  }, [currentGame]);

  const squares = useMemo(() => {
    const items: Array<{ key: string; className: string; content: string; square: string }> = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRank = flipped ? row : 7 - row;
        const displayFile = flipped ? 7 - col : col;
        const square = coordsToSquare(displayFile, displayRank);
        const isLight = isLightSquare(displayFile, displayRank);
        const piece = board ? board[displayRank][displayFile] : null;
        const content = piece ? getPieceSymbol(piece) : '';
        items.push({
          key: `${row}-${col}`,
          className: `square ${isLight ? 'light' : 'dark'}`,
          content,
          square,
        });
      }
    }
    return items;
  }, [board, flipped]);

  return (
    <div className="chess-area">
      {showHeartGlow && <div className="heart-bg"></div>}
      <div className="board">
        {squares.map((sq) => (
          <div
            key={sq.key}
            className={sq.className}
            onClick={() => {
              if (!interactive) return;
              if (!currentGame) return;
              selectSquare(sq.square);
            }}
          >
            {sq.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RomanticChessboard;
