import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GenderSelector from '../components/GenderSelector';
import MatchStatus from '../components/MatchStatus';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

const LandingPage: React.FC = () => {
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const currentGame = useGameStore((state) => state.currentGame);
  const error = useGameStore((state) => state.error);

  useEffect(() => {
    if (isConnected && currentGame && currentGame.status === 'active') {
      navigate(`/game/${currentGame.gameId}`);
    }
  }, [isConnected, currentGame, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">ChessDate</h1>
            <p className="text-gray-400 text-lg">
              Find love through chess ♟️ ❤️
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Match with the opposite gender and play chess while chatting
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Connecting to server...</p>
              {/* show any error we picked up during the connection process */}
              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {error}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                  >
                    Try refreshing the page
                  </button>
                </div>
              )}
              <div className="mt-4 text-[10px] text-gray-600">
                Host: {window.location.hostname}
              </div>
            </div>
          ) : (
            <>
              <GenderSelector />
              <div className="mt-8">
                <MatchStatus />
              </div>
            </>
          )}

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>No registration required • Random matchmaking • Play & chat</p>
            <div className="mt-4 pt-4 border-t border-gray-700 opacity-50">
              <p>v1.0.2 • {window.location.hostname} • {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;