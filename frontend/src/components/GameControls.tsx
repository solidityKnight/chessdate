import React from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { RefreshCcw, UserPlus, Flag, MessageCircleHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GameControls: React.FC = () => {
  const { 
    currentGame, 
    resignGame, 
    requestNewGame, 
    requestRematch, 
    acceptRematch, 
    declineRematch,
    rematchStatus 
  } = useChessGame();
  const { cancelMatchmaking, isInQueue } = useMatchmaking();

  if (isInQueue) {
    return (
      <div className="flex justify-center">
        <button
          onClick={cancelMatchmaking}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg flex items-center"
        >
          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
          Cancel Matchmaking
        </button>
      </div>
    );
  }

  if (!currentGame) return null;

  const isGameOver = currentGame.status === 'finished' || 
    ['checkmate', 'stalemate', 'draw'].includes(currentGame.gameStatus?.status || '');

  const displayPickUpLine = currentGame.pickUpLine || (window as any)._lastPickUpLine;
  if (currentGame.pickUpLine) (window as any)._lastPickUpLine = currentGame.pickUpLine;

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* AI Pick-up Line (only at start or when active) */}
      <AnimatePresence>
        {displayPickUpLine && !isGameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-pink-500/10 border border-pink-500/30 p-3 rounded-xl flex items-start space-x-3 max-w-sm"
          >
            <MessageCircleHeart className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
            <p className="text-pink-200 text-xs italic leading-relaxed">
              "{displayPickUpLine}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center space-x-3 w-full">
        {isGameOver ? (
          <>
            {rematchStatus === 'received' ? (
              <div className="flex flex-col items-center space-y-2 w-full">
                <p className="text-xs text-blue-400 font-bold animate-pulse">Opponent wants a rematch!</p>
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={acceptRematch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-bold hover:bg-blue-700 transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={declineRematch}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg font-bold hover:bg-gray-600 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : rematchStatus === 'requested' ? (
              <button
                disabled
                className="flex-1 px-4 py-3 bg-blue-600/50 text-white/50 text-sm rounded-lg font-bold cursor-not-allowed flex items-center justify-center"
              >
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                Waiting for opponent...
              </button>
            ) : (
              <>
                <button
                  onClick={requestRematch}
                  disabled={rematchStatus === 'declined'}
                  className="flex-1 px-4 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all font-bold shadow-lg flex items-center justify-center disabled:opacity-50"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  {rematchStatus === 'declined' ? 'Rematch Declined' : 'Rematch'}
                </button>
                <button
                  onClick={requestNewGame}
                  className="flex-1 px-4 sm:px-6 py-3 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-all font-bold shadow-lg flex items-center justify-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  New Game
                </button>
              </>
            )}
          </>
        ) : (
          <button
            onClick={resignGame}
            className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-600/30 text-sm sm:text-base rounded-lg hover:bg-red-600/30 transition-all font-bold flex items-center"
          >
            <Flag className="w-4 h-4 mr-2" />
            Resign
          </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;