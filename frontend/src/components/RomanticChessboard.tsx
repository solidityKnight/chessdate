import React, { useMemo } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../store/gameStore';
import { coordsToSquare, getPieceSymbol, isLightSquare, parseFEN } from '../utils/chessHelpers';
import { PlayerTimer } from './PlayerTimer';

type RomanticChessboardProps = {
  interactive?: boolean;
  showHeartGlow?: boolean;
};

const RomanticChessboard: React.FC<RomanticChessboardProps> = ({ interactive = true, showHeartGlow = true }) => {
  const currentGame = useGameStore((s) => s.currentGame);
  const { selectSquare, selectedSquare, possibleMoves } = useChessGame();
  const flipped = currentGame?.playerColor === 'black';
  const turn = currentGame?.board?.split(' ')[1] || 'w';

  const board = useMemo(() => {
    if (!currentGame?.board) return null;
    try {
      return parseFEN(currentGame.board);
    } catch {
      return null;
    }
  }, [currentGame]);

  const squares = useMemo(() => {
    const items: Array<{ key: string; className: string; content: string; square: string; hasPiece: boolean; isPossible: boolean; isSelected: boolean }> = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRank = flipped ? row : 7 - row;
        const displayFile = flipped ? 7 - col : col;
        const square = coordsToSquare(displayFile, displayRank);
        const isLight = isLightSquare(displayFile, displayRank);
        const piece = board ? board[displayRank][displayFile] : null;
        const content = piece ? getPieceSymbol(piece) : '';
        const isPossible = possibleMoves.includes(square);
        const isSelected = selectedSquare === square;
        items.push({
          key: `${row}-${col}`,
          className: `square ${isLight ? 'light' : 'dark'}`,
          content,
          square,
          hasPiece: !!piece,
          isPossible,
          isSelected,
        });
      }
    }
    return items;
  }, [board, flipped, possibleMoves, selectedSquare]);

  return (
    <div className="chess-area">
      {showHeartGlow && <div className="heart-bg"></div>}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {currentGame && <PlayerTimer color={flipped ? 'white' : 'black'} active={flipped ? turn === 'w' : turn === 'b'} />}
        <div className="board">
        {squares.map((sq) => (
          <div
            key={sq.key}
            className={`${sq.className}${sq.isSelected ? ' selected' : ''}${sq.isPossible ? ' possible' : ''}`}
            onClick={() => {
              if (!interactive) return;
              if (!currentGame) return;
              selectSquare(sq.square);
            }}
          >
            {sq.content}
            {sq.isPossible && (
              <span className={sq.hasPiece ? 'move-capture-ring' : 'move-dot'} />
            )}
          </div>
        ))}
        </div>
        {currentGame && <PlayerTimer color={flipped ? 'black' : 'white'} active={flipped ? turn === 'b' : turn === 'w'} />}
      </div>
    </div>
  );
};

export default RomanticChessboard;
