import React, { useEffect, useRef, useState } from 'react';
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
  const [editData, setEditData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setRecentGames(response.data.recentGames);
        
        const profileUser = response.data.user;
        if (profileUser) {
          setEditData({
            displayName: profileUser.displayName || '',
            age: profileUser.age || '',
            bio: profileUser.bio || '',
            city: profileUser.city || '',
            country: profileUser.country || '',
            interests: profileUser.interests || [],
            profilePhoto: profileUser.profilePhoto || '',
            learnMode: profileUser.learnMode ?? true,
          });
          setUser(profileUser);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]); // Dependencies are fine now that we don't guard with a ref

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  // FIX 5: Cancel editing and restore fields from the current user object.
  const handleCancelEdit = () => {
    setEditData({
      displayName: user?.displayName || '',
      age: user?.age || '',
      bio: user?.bio || '',
      city: user?.city || '',
      country: user?.country || '',
      interests: user?.interests || [],
      profilePhoto: user?.profilePhoto || '',
      learnMode: user?.learnMode ?? true,
    });
    setIsEditing(false);
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

  return (
    <RomanticLayout>
      <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-pink-100 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-pink-400 to-rose-500 opacity-10 group-hover:opacity-20 transition-opacity duration-700" />

          <div className="relative p-8 md:p-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-pink-400 blur-2xl rounded-full opacity-20 group-hover/avatar:opacity-40 transition-opacity" />
                  <div className="relative w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-pink-100 to-rose-100 p-1 shadow-2xl transform rotate-3 group-hover/avatar:rotate-0 transition-transform duration-500">
                    <div className="w-full h-full rounded-[2.3rem] overflow-hidden border-4 border-white bg-white flex items-center justify-center">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.username}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                        />
                      ) : (
                        <span className="text-6xl font-black text-pink-300 uppercase">
                          {user.username?.[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  {user?.isOnline && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                  )}
                </div>

                <div className="text-center md:text-left space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
                      {user.displayName || user.username}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <EloBadge rating={user.eloRating || 1200} />
                      {user.role === 'admin' && (
                        <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-pink-400">@</span>
                      {user.username}
                    </span>
                    <span className="w-1 h-1 bg-pink-200 rounded-full" />
                    <span className="flex items-center gap-1.5">
                      <span className="text-pink-400 text-xs">⚤</span>
                      {user.gender}
                    </span>
                    {(user.city || user.country) && (
                      <>
                        <span className="w-1 h-1 bg-pink-200 rounded-full" />
                        <span className="flex items-center gap-1.5">
                          <span className="grayscale opacity-50">📍</span>
                          {user.city}
                          {user.city && user.country ? ', ' : ''}
                          {user.country}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                {!isEditing ? (
                  <RomanticButton onClick={() => setIsEditing(true)} className="px-8 shadow-lg shadow-pink-500/20">
                    Edit Profile
                  </RomanticButton>
                ) : (
                  <>
                    <RomanticButton onClick={handleSave} className="px-8 shadow-lg shadow-green-500/20">
                      Save Changes ✨
                    </RomanticButton>
                    {/* FIX 5: Cancel button to discard edits. */}
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-3 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Side: About & Interests */}
              <div className="lg:col-span-4 space-y-10">
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-500 text-sm">
                      ✨
                    </div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">
                      The Story
                    </h3>
                  </div>

                  {isEditing ? (
                    // FIX 4: Added missing inputs for displayName, profilePhoto, city, country.
                    <div className="space-y-6 animate-slide-up">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                          value={editData.displayName}
                          onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                          placeholder="Your display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                          Your Bio
                        </label>
                        <textarea
                          className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
                          value={editData.bio}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          rows={4}
                          placeholder="Tell the kingdom your story..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                            Age
                          </label>
                          <input
                            type="number"
                            className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800"
                            value={editData.age}
                            onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                            City
                          </label>
                          <input
                            type="text"
                            className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                          Country
                        </label>
                        <input
                          type="text"
                          className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                          value={editData.country}
                          onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                          placeholder="Country"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-2">
                          Profile Photo URL
                        </label>
                        <input
                          type="url"
                          className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300"
                          value={editData.profilePhoto}
                          onChange={(e) => setEditData({ ...editData, profilePhoto: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                        <input
                          type="checkbox"
                          id="learnMode"
                          className="w-5 h-5 text-pink-600 border-pink-300 rounded-lg focus:ring-pink-500 cursor-pointer"
                          checked={editData.learnMode}
                          onChange={(e) => setEditData({ ...editData, learnMode: e.target.checked })}
                        />
                        <label
                          htmlFor="learnMode"
                          className="text-[10px] font-black text-pink-600 uppercase tracking-widest cursor-pointer"
                        >
                          Learn While Dating Mode
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="absolute -top-4 -left-4 text-6xl text-pink-100 opacity-50 font-serif">"</div>
                        <p className="relative z-10 text-gray-600 text-lg leading-relaxed font-medium italic pl-4">
                          {user.bio || 'This strategic mind is still writing its story...'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(user.interests?.length ?? 0) > 0 ? (
                          user.interests!.map((interest: string) => (
                            <span
                              key={interest}
                              className="px-4 py-1.5 bg-white text-pink-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-pink-50 shadow-sm hover:border-pink-200 transition-colors cursor-default"
                            >
                              #{interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300 text-[10px] font-bold uppercase italic">
                            No interests selected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 pt-4 border-t border-pink-50">
                        <div className="text-center">
                          <div className="text-2xl font-black text-gray-800 tracking-tighter">
                            {user.age || '??'}
                          </div>
                          <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Age</div>
                        </div>
                        <div className="w-px h-8 bg-pink-50" />
                        <div className="text-center">
                          <div
                            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                              user.learnMode
                                ? 'bg-green-50 text-green-600 border border-green-100'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {user.learnMode ? 'Learning' : 'Standard'}
                          </div>
                          <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Mode
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Battle Records */}
                <section className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group/stats">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em]">
                        Battle Records
                      </h3>
                      <span className="text-xl">📊</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-3xl font-black tracking-tighter">{user.gamesPlayed || 0}</div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                          Total Battles
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black tracking-tighter text-green-400">
                          {user.gamesPlayed > 0
                            ? Math.round((user.wins / user.gamesPlayed) * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                          Win Rate
                        </div>
                      </div>
                    </div>

                    {/* FIX 3: Removed gap-2 and items-center — gaps break the bar so widths no longer sum to 100%. */}
                    <div className="flex h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-green-400 transition-all duration-1000"
                        style={{ width: `${(user.wins / (user.gamesPlayed || 1)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-blue-400 transition-all duration-1000"
                        style={{ width: `${(user.draws / (user.gamesPlayed || 1)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-red-400 transition-all duration-1000"
                        style={{ width: `${(user.losses / (user.gamesPlayed || 1)) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <span>W</span> {user.wins || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <span>D</span> {user.draws || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <span>L</span> {user.losses || 0}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Side: Recent Battles */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-500 text-sm">
                      ⚔️
                    </div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">
                      Recent Encounters
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Season 1</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
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
                      const colorClass =
                        outcome === 'WIN'
                          ? 'text-green-500'
                          : outcome === 'DRAW'
                          ? 'text-blue-500'
                          : 'text-red-500';
                      const bgClass =
                        outcome === 'WIN'
                          ? 'bg-green-50/50'
                          : outcome === 'DRAW'
                          ? 'bg-blue-50/50'
                          : 'bg-red-50/50';
                      const borderClass =
                        outcome === 'WIN'
                          ? 'border-green-100'
                          : outcome === 'DRAW'
                          ? 'border-blue-100'
                          : 'border-red-100';

                      return (
                        <div
                          key={idx}
                          className={`group/game p-6 rounded-[2rem] border-2 ${borderClass} ${bgClass} backdrop-blur-sm flex items-center justify-between hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-xl`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-white p-0.5 shadow-md border border-white group-hover/game:rotate-6 transition-transform">
                                {opponent?.profilePhoto ? (
                                  <img
                                    src={opponent.profilePhoto}
                                    alt="Opponent"
                                    className="w-full h-full rounded-[0.9rem] object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-[0.9rem] bg-pink-50 flex items-center justify-center text-xl font-black text-pink-200">
                                    {opponent?.username?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg ${
                                  isWhite ? 'bg-gray-100 !text-gray-800' : 'bg-gray-800'
                                }`}
                              >
                                {isWhite ? 'W' : 'B'}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  VS
                                </span>
                                <h4 className="font-black text-gray-800 group-hover/game:text-pink-600 transition-colors">
                                  {opponent?.displayName || opponent?.username || 'Mysterious Guest'}
                                </h4>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight opacity-70">
                                <span>
                                  {new Date(game.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                <span>{game.result || 'Checkmate'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`text-2xl font-black tracking-tighter ${colorClass} group-hover/game:scale-110 transition-transform`}
                            >
                              {outcome}
                            </div>
                            <div className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">
                              Outcome
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-24 text-center bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-pink-100 flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-4xl animate-bounce">
                        ⚔️
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">No battles yet</h3>
                        <p className="text-gray-400 italic font-medium">
                          "Fortune favors the bold. Go forth and conquer, love."
                        </p>
                      </div>
                      <RomanticButton onClick={() => navigate('/play')} className="mt-4">
                        Find First Match
                      </RomanticButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default ProfilePage;