import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import { Trophy, Clock, Target, User as UserIcon, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, setUser, setToken } = useGameStore();
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setRecentGames(response.data.recentGames);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  if (!user || loading) return <div className="p-8 text-center">Loading...</div>;

  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100) 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                {user.username}
                {user.role === 'admin' && <ShieldCheck className="ml-2 text-yellow-500 w-5 h-5" />}
              </h1>
              <p className="text-gray-400 capitalize">{user.gender}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {user.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-yellow-600/20 text-yellow-500 rounded-lg hover:bg-yellow-600/30 transition-all border border-yellow-600/30"
              >
                Admin Panel
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-all border border-red-600/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Credits Card */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl col-span-1">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Credits
            </h2>
            <div className="text-center py-4">
              <span className="text-4xl font-bold text-blue-500">{user.credits}</span>
              <span className="text-gray-400 text-lg"> / 5</span>
              <p className="text-sm text-gray-500 mt-2">
                {user.gamesPlayedInCredit} / 5 games played in current credit
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-pink-400" />
              Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{user.stats.gamesPlayed}</p>
                <p className="text-xs text-gray-500 uppercase">Games</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{user.stats.wins}</p>
                <p className="text-xs text-gray-500 uppercase">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{user.stats.losses}</p>
                <p className="text-xs text-gray-500 uppercase">Losses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
                <p className="text-xs text-gray-500 uppercase">Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <h2 className="text-lg font-semibold mb-6 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user.achievements.length > 0 ? (
              user.achievements.map((a, i) => (
                <div key={i} className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex items-center space-x-3">
                  <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-3 text-center py-4 italic">
                No achievements unlocked yet. Keep playing!
              </p>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-400" />
              Recent Games
            </h2>
          </div>
          <div className="divide-y divide-gray-700">
            {recentGames.length > 0 ? (
              recentGames.map((game, i) => {
                const isWhite = game.whitePlayerId === user.id;
                const result = game.winnerId === user.id ? 'Win' : (game.winnerId ? 'Loss' : 'Draw');
                const opponent = isWhite ? game.blackPlayer.username : game.whitePlayer.username;
                
                return (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-700/30 transition-all cursor-default">
                    <div>
                      <p className="font-medium">vs {opponent}</p>
                      <p className="text-xs text-gray-500">{new Date(game.startedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        result === 'Win' ? 'bg-green-500/10 text-green-500' :
                        result === 'Loss' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {result}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-8 text-center text-gray-500 italic">No recent games found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
