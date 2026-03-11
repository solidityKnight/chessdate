import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GenderSelector from '../components/GenderSelector';
import MatchStatus from '../components/MatchStatus';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { User, Trophy, ShieldCheck, Heart, LogOut, Clock } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const { currentGame, error, user, setUser, setToken } = useGameStore();
  const [regenTimer, setRegenTimer] = useState<string>('');

  useEffect(() => {
    if (isConnected && currentGame && currentGame.status === 'active') {
      navigate(`/game/${currentGame.gameId}`);
    }
  }, [isConnected, currentGame, navigate]);

  useEffect(() => {
    if (!user) return;

    const updateTimer = () => {
      const now = new Date();
      const lastRegen = new Date(user.lastCreditRegen);
      const nextRegen = new Date(lastRegen.getTime() + (6 * 60 * 60 * 1000));
      const diff = nextRegen.getTime() - now.getTime();

      if (diff <= 0) {
        setRegenTimer('Regenerating...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRegenTimer(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen lg:h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto lg:overflow-hidden p-4">
      <div className="max-w-md w-full">
        {/* User Status Bar */}
        {user && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-t-xl border-x border-t border-gray-700 p-4 flex justify-between items-center shadow-lg">
            <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold flex items-center">
                  {user.username}
                  {user.role === 'admin' && <ShieldCheck className="ml-1 text-yellow-500 w-3 h-3" />}
                </p>
                <div className="flex items-center text-[10px] text-gray-400">
                  <Heart className="w-2 h-2 mr-1 text-pink-500 fill-current" />
                  <span className="capitalize">{user.gender}</span>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center justify-end text-blue-400 font-bold text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {user.credits} Credits
                </div>
                {user.credits < 5 && (
                  <p className="text-[9px] text-gray-500">Regen in {regenTimer}</p>
                )}
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className={`bg-gray-800 shadow-2xl p-8 border border-gray-700 ${user ? 'rounded-b-xl' : 'rounded-xl'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Heart className="text-pink-500 w-12 h-12 fill-current animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ChessDate</h1>
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
              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
                    Try refreshing the page
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {user && user.credits === 0 && user.gamesPlayedInCredit === 0 ? (
                <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl text-center space-y-3">
                  <Clock className="w-10 h-10 text-red-500 mx-auto" />
                  <h3 className="font-bold text-red-400">Out of Credits</h3>
                  <p className="text-sm text-gray-400">
                    Your next credit will regenerate in:<br/>
                    <span className="text-white font-mono text-lg">{regenTimer}</span>
                  </p>
                  <button 
                    disabled 
                    className="w-full py-3 bg-gray-700 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                  >
                    Matchmaking Blocked
                  </button>
                </div>
              ) : (
                <>
                  <GenderSelector />
                  <MatchStatus />
                </>
              )}
            </div>
          )}

          <div className="mt-8 text-center text-[10px] text-gray-500 space-y-2">
            <div className="flex justify-center space-x-4 mb-4">
              <Link to="/profile" className="hover:text-white transition-colors flex items-center">
                <User className="w-3 h-3 mr-1" /> Profile
              </Link>
              <Link to="/profile" className="hover:text-white transition-colors flex items-center">
                <Trophy className="w-3 h-3 mr-1" /> Achievements
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                </Link>
              )}
            </div>
            <p>1 credit = 5 games • +1 credit every 6 hours</p>
            <div className="pt-4 border-t border-gray-700 opacity-50">
              <p>v1.1.0 • {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;