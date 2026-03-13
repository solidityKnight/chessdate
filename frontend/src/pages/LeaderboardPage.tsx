import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import EloBadge from '../components/EloBadge';

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/leaderboard');
        setPlayers(response.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <RomanticLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Grandmaster Love Leaderboard 🏆</h1>
          <p className="text-pink-500 font-medium italic">Who is the most strategic lover in the kingdom?</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl border border-pink-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-pink-50 border-b border-pink-100">
                  <th className="px-6 py-4 text-xs font-bold text-pink-600 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-pink-600 uppercase tracking-widest">Player</th>
                  <th className="px-6 py-4 text-xs font-bold text-pink-600 uppercase tracking-widest">Elo Rating</th>
                  <th className="px-6 py-4 text-xs font-bold text-pink-600 uppercase tracking-widest text-center">W / L / D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8" /></td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100" />
                        <div className="h-4 bg-gray-100 rounded w-24" />
                      </td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : players.length > 0 ? (
                  players.map((player, idx) => (
                    <tr key={player.id} className={`hover:bg-pink-50/50 transition-colors ${idx === 0 ? 'bg-yellow-50/30' : idx === 1 ? 'bg-gray-50/30' : idx === 2 ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-400 text-white shadow-md' : 
                            idx === 1 ? 'bg-gray-300 text-white shadow-md' : 
                            idx === 2 ? 'bg-orange-400 text-white shadow-md' : 
                            'text-gray-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border border-pink-200 uppercase flex-shrink-0">
                            {player.profilePhoto ? (
                              <img src={player.profilePhoto} alt={player.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              player.username[0]
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{player.displayName || player.username}</div>
                            {player.country && <div className="text-[10px] text-gray-400">📍 {player.country}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <EloBadge rating={player.eloRating} className="text-sm px-3 py-1" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-bold text-gray-600">
                          <span className="text-green-500">{player.wins}</span> / <span className="text-red-500">{player.losses}</span> / <span className="text-blue-500">{player.draws}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No rankings available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default LeaderboardPage;
