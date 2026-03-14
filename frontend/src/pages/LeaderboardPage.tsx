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
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <div className="inline-block px-4 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-widest mb-2 shadow-sm">
            Top Players
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            Grandmaster <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 italic">Love</span> Leaderboard
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
            Witness the most strategic minds in the kingdom. Where every move is calculated, and every victory is a step closer to <span className="text-pink-400 font-semibold italic">perfection</span>.
          </p>
        </div>

        {/* Top 3 Podium */}
        {!loading && players.length >= 3 && (
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 px-4">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 w-full md:w-64 bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 border border-pink-100 shadow-xl flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-slate-300 p-1 shadow-inner bg-white overflow-hidden">
                  {players[1].profilePhoto ? (
                    <img src={players[1].profilePhoto} alt={players[1].username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300 uppercase">
                      {players[1].username[0]}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">2</div>
              </div>
              <h3 className="font-bold text-gray-800 text-center truncate w-full">{players[1].displayName || players[1].username}</h3>
              <EloBadge rating={players[1].eloRating} className="mt-2 text-xs" />
              <div className="h-16 w-full mt-4 bg-slate-100/50 rounded-xl flex items-center justify-center text-slate-400 font-black text-2xl">II</div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 w-full md:w-72 bg-gradient-to-b from-white to-pink-50 rounded-[2.5rem] p-8 border-2 border-yellow-200 shadow-2xl flex flex-col items-center transform hover:-translate-y-4 transition-transform duration-300 z-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/20 blur-3xl -mr-12 -mt-12 rounded-full" />
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-yellow-400 p-1 shadow-inner bg-white overflow-hidden">
                  {players[0].profilePhoto ? (
                    <img src={players[0].profilePhoto} alt={players[0].username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-yellow-500 uppercase">
                      {players[0].username[0]}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white text-lg font-black border-4 border-white shadow-xl animate-bounce">1</div>
              </div>
              <h3 className="text-xl font-black text-gray-900 text-center truncate w-full">{players[0].displayName || players[0].username}</h3>
              <EloBadge rating={players[0].eloRating} className="mt-2 scale-110" />
              <div className="h-24 w-full mt-6 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-yellow-600 font-black text-4xl">I</div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 w-full md:w-64 bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 border border-pink-100 shadow-xl flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-orange-300 p-1 shadow-inner bg-white overflow-hidden">
                  {players[2].profilePhoto ? (
                    <img src={players[2].profilePhoto} alt={players[2].username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-orange-300 uppercase">
                      {players[2].username[0]}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">3</div>
              </div>
              <h3 className="font-bold text-gray-800 text-center truncate w-full">{players[2].displayName || players[2].username}</h3>
              <EloBadge rating={players[2].eloRating} className="mt-2 text-xs" />
              <div className="h-12 w-full mt-4 bg-orange-100/50 rounded-xl flex items-center justify-center text-orange-400 font-black text-2xl">III</div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-pink-100 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/20 to-transparent pointer-events-none" />
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                  <th className="px-8 py-6 text-[10px] font-black text-pink-600 uppercase tracking-[0.2em]">Pos</th>
                  <th className="px-8 py-6 text-[10px] font-black text-pink-600 uppercase tracking-[0.2em]">Grandmaster</th>
                  <th className="px-8 py-6 text-[10px] font-black text-pink-600 uppercase tracking-[0.2em]">Elo Rating</th>
                  <th className="px-8 py-6 text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] text-center">W / L / D</th>
                  <th className="px-8 py-6 text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] text-center">Winrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-4 bg-pink-100/50 rounded w-6" /></td>
                      <td className="px-8 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-100/50" />
                        <div className="space-y-2">
                          <div className="h-4 bg-pink-100/50 rounded w-32" />
                          <div className="h-3 bg-pink-100/30 rounded w-20" />
                        </div>
                      </td>
                      <td className="px-8 py-6"><div className="h-8 bg-pink-100/50 rounded-xl w-24" /></td>
                      <td className="px-8 py-6"><div className="h-4 bg-pink-100/50 rounded w-20 mx-auto" /></td>
                      <td className="px-8 py-6"><div className="h-4 bg-pink-100/50 rounded w-12 mx-auto" /></td>
                    </tr>
                  ))
                ) : players.length > 0 ? (
                  players.map((player, idx) => {
                    const total = player.wins + player.losses + player.draws;
                    const winrate = total > 0 ? Math.round((player.wins / total) * 100) : 0;
                    
                    return (
                      <tr key={player.id} className={`group/row hover:bg-pink-50/50 transition-all duration-300 relative ${idx < 3 ? 'hidden md:table-row' : ''}`}>
                        <td className="px-8 py-6">
                          <span className={`text-sm font-black tracking-tighter ${
                            idx === 0 ? 'text-yellow-500' : 
                            idx === 1 ? 'text-slate-400' : 
                            idx === 2 ? 'text-orange-500' : 
                            'text-gray-300'
                          }`}>
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl p-0.5 border shadow-sm transition-transform group-hover/row:scale-110 duration-300 ${
                              idx === 0 ? 'border-yellow-200 bg-yellow-50' : 
                              idx === 1 ? 'border-slate-200 bg-slate-50' : 
                              idx === 2 ? 'border-orange-200 bg-orange-50' : 
                              'border-pink-100 bg-white'
                            }`}>
                              {player.profilePhoto ? (
                                <img src={player.profilePhoto} alt={player.username} className="w-full h-full rounded-[0.8rem] object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-pink-300 text-lg">
                                  {player.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-black text-gray-800 text-sm group-hover/row:text-pink-600 transition-colors">{player.displayName || player.username}</div>
                              {player.country && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic opacity-70">📍 {player.country}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <EloBadge rating={player.eloRating} className="text-xs px-4 py-1.5 shadow-sm" />
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-tight">
                            <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{player.wins}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">{player.losses}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{player.draws}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="relative inline-flex items-center justify-center">
                            <svg className="w-10 h-10 transform -rotate-90">
                              <circle className="text-pink-50" strokeWidth="3" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
                              <circle className="text-pink-500 transition-all duration-1000" strokeWidth="3" strokeDasharray={100} strokeDashoffset={100 - winrate} strokeLinecap="round" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
                            </svg>
                            <span className="absolute text-[10px] font-black text-pink-600">{winrate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-3xl">🏜️</div>
                        <p className="text-gray-400 font-medium italic">The leaderboard is currently a lonely desert. Be the first to conquer it!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-12 text-center text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">
          Updated every match in real-time • Season 1
        </div>
      </div>
    </RomanticLayout>
  );
};

export default LeaderboardPage;
