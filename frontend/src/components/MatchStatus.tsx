import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getGameResultMessage } from '../utils/chessHelpers';

const MatchStatus: React.FC = () => {
  const { currentGame, isInQueue, queueStats, selectedGender, error } = useGameStore();

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-3 sm:p-4 text-center w-full max-w-lg">
        <p className="text-red-200 font-semibold text-sm sm:text-base">Error</p>
        <p className="text-red-100 text-xs sm:text-sm">{error}</p>
      </div>
    );
  }

  if (isInQueue) {
    return (
      <div className="game-status waiting w-full max-w-lg">
        <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-yellow-600 mx-auto mb-2"></div>
        <p className="font-semibold text-sm sm:text-base">Finding opponent...</p>
        <p className="text-xs sm:text-sm opacity-90">
          Selected: {selectedGender} • Queue: {queueStats?.total || 0} players
        </p>
        {queueStats && (
          <p className="text-xs opacity-75">
            Males: {queueStats.male} • Females: {queueStats.female}
          </p>
        )}
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="game-status waiting w-full max-w-lg">
        <p className="text-xs sm:text-sm">Select your gender to start matchmaking</p>
      </div>
    );
  }

  if (currentGame.status === 'finished') {
    return (
      <div className="game-status finished w-full max-w-lg">
        <p className="text-lg sm:text-xl font-bold mb-2">Game Over!</p>
        <p className="text-xs sm:text-sm">{getGameResultMessage(currentGame.result || '', currentGame.winner)}</p>
        <p className="text-xs mt-2 opacity-90">
          You played as {currentGame.playerColor}
        </p>
      </div>
    );
  }

  const currentTurn = currentGame.board.split(' ')[1]; // 'w' or 'b'
  const isMyTurn = (playerColor === 'white' && currentTurn === 'w') || 
                   (playerColor === 'black' && currentTurn === 'b');

  return (
    <div className={`game-status active w-full max-w-lg transition-colors ${isMyTurn ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-800/50 border-gray-700'}`}>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm sm:text-lg font-bold">
          {playerColor === 'white' ? 'White ♔' : 'Black ♚'} (You)
        </p>
        {isMyTurn && (
          <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider font-black">
            Your Turn
          </span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs text-gray-400">
        Opponent: {currentGame.opponentColor === 'white' ? 'White ♔' : 'Black ♚'}
      </p>
      <div className="mt-1 flex justify-between items-center opacity-40">
        <p className="text-[8px] sm:text-[10px] truncate max-w-[120px]">ID: {currentGame.gameId}</p>
        <p className="text-[8px] sm:text-[10px]">Status: {currentGame.gameStatus.status}</p>
      </div>
    </div>
  );
};

export default MatchStatus;