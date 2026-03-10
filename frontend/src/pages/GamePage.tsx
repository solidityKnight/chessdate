import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import ChatBox from '../components/ChatBox';
import MatchStatus from '../components/MatchStatus';
import GameControls from '../components/GameControls';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socketService';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentGame, isConnected } = useGameStore();

  useEffect(() => {
    // If no game ID in URL or no current game, redirect to home
    if (!gameId || !currentGame || currentGame.gameId !== gameId) {
      navigate('/');
      return;
    }

    // Load chat history when game starts
    socketService.getChatHistory();
  }, [gameId, currentGame, navigate]);

  // Handle game end - redirect after a delay
  useEffect(() => {
    if (currentGame?.status === 'finished') {
      const timer = setTimeout(() => {
        // Optionally auto-redirect or show option to find new opponent
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentGame?.status]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Reconnecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Chess Board - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="bg-gray-800 rounded-lg p-3 sm:p-6 border border-gray-700 w-full lg:w-auto">
              <div className="flex justify-center mb-3 sm:mb-4">
                <MatchStatus />
              </div>
              <div className="flex justify-center">
                <ChessBoard />
              </div>
              <div className="mt-4 sm:mt-6">
                <GameControls />
              </div>
            </div>
          </div>

          {/* Chat - Takes up 1 column on large screens */}
          <div className="lg:col-span-1">
            <ChatBox />
          </div>
        </div>

        {/* Game Info Footer */}
        <div className="mt-4 sm:mt-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>ChessDate • Real-time chess with matchmaking</p>
          {currentGame && (
            <p className="mt-1">
              Game: {currentGame.gameId} • Status: {currentGame.status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;