
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import EloBadge from '../components/EloBadge';

interface Game {
  whitePlayerId: number;
  blackPlayer: any;
  whitePlayer: any;
  winner: string;
  result: string;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const { user, setUser, setToken } = useGameStore();

  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState<any>({
    displayName: '',
    age: '',
    bio: '',
    city: '',
    country: '',
    interests: [],
    profilePhoto: '',
    learnMode: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/profile');

        setRecentGames(response.data.recentGames);

        setEditData({
          displayName: response.data.user?.displayName || '',
          age: response.data.user?.age || '',
          bio: response.data.user?.bio || '',
          city: response.data.user?.city || '',
          country: response.data.user?.country || '',
          interests: response.data.user?.interests || [],
          profilePhoto: response.data.user?.profilePhoto || '',
          learnMode: response.data.user?.learnMode ?? true
        });

        setUser(response.data.user);

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

  const handleSave = async () => {
    try {
      const response = await api.put('/user/profile', editData);
      setUser(response.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  if (!user || loading) {
    return (
      <RomanticLayout>
        <div className="page-center">
          <div className="card text-center">
            <div className="text-4xl mb-2">🌸</div>
            <div className="font-bold text-2xl text-gray-800">Loading Profile…</div>
            <div className="opacity-75 mt-2 text-gray-600">
              One moment while we fetch your love stats.
            </div>
          </div>
        </div>
      </RomanticLayout>
    );
  }

  const winRate =
    user.gamesPlayed > 0
      ? Math.round((user.wins / user.gamesPlayed) * 100)
      : 0;

  const winPercent =
    user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0;

  const drawPercent =
    user.gamesPlayed > 0 ? (user.draws / user.gamesPlayed) * 100 : 0;

  const lossPercent =
    user.gamesPlayed > 0 ? (user.losses / user.gamesPlayed) * 100 : 0;

  return (
    <RomanticLayout>
      <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">

        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-pink-100 overflow-hidden relative group">

          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-pink-400 to-rose-500 opacity-10 group-hover:opacity-20 transition-opacity duration-700" />

          <div className="relative p-8 md:p-12">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">

              <div className="flex flex-col md:flex-row items-center md:items-end gap-8">

                {/* Avatar */}
                <div className="relative">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-pink-100 to-rose-100 p-1 shadow-2xl">

                    <div className="w-full h-full rounded-[2.3rem] overflow-hidden border-4 border-white bg-white flex items-center justify-center">

                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl font-black text-pink-300 uppercase">
                          {user.username?.[0]}
                        </span>
                      )}

                    </div>
                  </div>

                  {user.isOnline && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse" />
                  )}
                </div>

                {/* Name */}
                <div className="text-center md:text-left space-y-3">

                  <div className="flex flex-col md:flex-row md:items-center gap-3">

                    <h1 className="text-5xl font-black text-gray-900">
                      {user.displayName || user.username}
                    </h1>

                    <EloBadge rating={user.eloRating || 1200} />

                  </div>

                  <div className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    @{user.username} • {user.gender}
                  </div>

                </div>

              </div>

              {/* Buttons */}
              <div className="flex gap-4">

                {!isEditing ? (
                  <RomanticButton onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </RomanticButton>
                ) : (
                  <RomanticButton onClick={handleSave}>
                    Save Changes ✨
                  </RomanticButton>
                )}

                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase text-[10px] hover:bg-red-50 hover:text-red-500 border"
                >
                  Logout
                </button>

              </div>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              <div className="lg:col-span-4 space-y-8">

                <div className="bg-gray-900 text-white rounded-[2rem] p-8">

                  <h3 className="text-pink-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    Battle Records
                  </h3>

                  <div className="grid grid-cols-2 gap-6 mb-6">

                    <div>
                      <div className="text-3xl font-black">{user.gamesPlayed}</div>
                      <div className="text-gray-400 text-[10px] uppercase">
                        Total Battles
                      </div>
                    </div>

                    <div>
                      <div className="text-3xl font-black text-green-400">
                        {winRate}%
                      </div>
                      <div className="text-gray-400 text-[10px] uppercase">
                        Win Rate
                      </div>
                    </div>

                  </div>

                  {/* Progress Bar */}
                  <div className="flex h-2 bg-white/10 rounded-full overflow-hidden">

                    <div
                      className="bg-green-400"
                      style={{ width: `${winPercent}%` }}
                    />

                    <div
                      className="bg-blue-400"
                      style={{ width: `${drawPercent}%` }}
                    />

                    <div
                      className="bg-red-400"
                      style={{ width: `${lossPercent}%` }}
                    />

                  </div>

                  <div className="flex justify-between text-[10px] font-bold mt-3">
                    <span className="text-green-400">W {user.wins}</span>
                    <span className="text-blue-400">D {user.draws}</span>
                    <span className="text-red-400">L {user.losses}</span>
                  </div>

                </div>

              </div>

              {/* Recent Games */}
              <div className="lg:col-span-8">

                <h3 className="text-sm font-black uppercase tracking-widest mb-6">
                  Recent Encounters
                </h3>

                <div className="space-y-4">

                  {recentGames.length > 0 ? (
                    recentGames.map((game, idx) => {

                      const isWhite = game.whitePlayerId === user.id;
                      const opponent = isWhite ? game.blackPlayer : game.whitePlayer;

                      const outcome =
                        game.winner === (isWhite ? 'white' : 'black')
                          ? 'WIN'
                          : game.winner === 'draw'
                          ? 'DRAW'
                          : 'LOSS';

                      return (
                        <div
                          key={idx}
                          className="p-6 rounded-2xl border bg-white flex justify-between items-center"
                        >

                          <div>
                            <div className="font-bold">
                              VS {opponent?.displayName || opponent?.username}
                            </div>

                            <div className="text-xs text-gray-400">
                              {new Date(game.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="font-black text-xl">
                            {outcome}
                          </div>

                        </div>
                      );

                    })
                  ) : (
                    <div className="text-center py-20">

                      <div className="text-4xl mb-4">⚔️</div>
