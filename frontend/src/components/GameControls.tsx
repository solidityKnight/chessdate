import React from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useMatchmaking } from '../hooks/useMatchmaking';

const GameControls: React.FC = () => {
  const { currentGame, resignGame, requestNewGame } = useChessGame();
  const { cancelMatchmaking, isInQueue } = useMatchmaking();

  if (isInQueue) {
    return (
      <div className="flex justify-center">
        <button
          onClick={cancelMatchmaking}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          Cancel Matchmaking
        </button>
      </div>
    );
  }

  if (!currentGame) {
    return null;
  }

  if (currentGame.status === 'finished' || 
      ['checkmate', 'stalemate', 'draw'].includes(currentGame.gameStatus.status)) {
    return (
      <div className="flex flex-col items-center space-y-3 w-full">
        <div className="flex justify-center space-x-4 w-full">
          <button
            onClick={requestNewGame}
            className="flex-1 max-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg transform active:scale-95"
          >
            Play Again
          </button>
        </div>
        <p className="text-gray-400 text-[10px] sm:text-xs italic">
          Click to find a new match
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={resignGame}
        className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors font-semibold"
      >
        Resign Game
      </button>
    </div>
  );
};

export default GameControls;