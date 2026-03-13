import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import EloBadge from '../components/EloBadge';

const ProfilePage: React.FC = () => {
  const { user, setUser, setToken } = useGameStore();
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setRecentGames(response.data.recentGames);
        setEditData({
          displayName: user?.displayName || '',
          age: user?.age || '',
          bio: user?.bio || '',
          city: user?.city || '',
          country: user?.country || '',
          interests: user?.interests || [],
          profilePhoto: user?.profilePhoto || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

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
            <div className="opacity-75 mt-2 text-gray-600">One moment while we fetch your love stats.</div>
          </div>
        </div>
      </RomanticLayout>
    );
  }

  return (
    <RomanticLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-pink-100 flex items-center justify-center text-4xl font-bold text-pink-500 border-2 border-pink-200 shadow-inner uppercase">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.username} className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  user.username?.[0]
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.displayName || user.username}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <EloBadge rating={user.eloRating || 1200} className="text-sm" />
                  <span className="text-gray-500 text-sm">@{user.username}</span>
                  <span className="text-pink-500 font-medium text-sm capitalize">{user.gender}</span>
                </div>
                {(user.city || user.country) && (
                  <p className="text-gray-500 text-sm mt-1">📍 {user.city}{user.city && user.country ? ', ' : ''}{user.country}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {!isEditing ? (
                <RomanticButton onClick={() => setIsEditing(true)}>Edit Profile</RomanticButton>
              ) : (
                <RomanticButton onClick={handleSave}>Save Changes</RomanticButton>
              )}
              {user.role === 'admin' && (
                <RomanticButton variant="secondary" onClick={() => navigate('/admin')}>Admin</RomanticButton>
              )}
              <RomanticButton variant="danger" onClick={handleLogout}>Logout</RomanticButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Info & Stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
                <h3 className="text-lg font-bold text-pink-700 mb-4">About Me</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-pink-600 uppercase">Bio</label>
                      <textarea 
                        className="w-full mt-1 p-2 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={editData.bio}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-pink-600 uppercase">Age</label>
                      <input 
                        type="number"
                        className="w-full mt-1 p-2 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={editData.age}
                        onChange={(e) => setEditData({...editData, age: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700 italic">"{user.bio || 'No bio yet...'}"</p>
                    {user.age && <p className="text-sm text-gray-600"><b>Age:</b> {user.age}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.interests?.map((interest: string) => (
                        <span key={interest} className="px-2 py-1 bg-white text-pink-600 text-xs font-bold rounded-full border border-pink-100">
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Chess Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Games Played</span>
                    <span className="font-bold text-gray-900">{user.gamesPlayed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-500">Wins</span>
                    <span className="font-bold text-green-600">{user.wins || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-500">Losses</span>
                    <span className="font-bold text-red-600">{user.losses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-500">Draws</span>
                    <span className="font-bold text-blue-600">{user.draws || 0}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-pink-50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-pink-500 font-bold">Win Rate</span>
                      <span className="font-bold text-pink-600">
                        {user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Games */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Games</h3>
              <div className="space-y-3">
                {recentGames.length > 0 ? (
                  recentGames.map((game, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-pink-50 hover:border-pink-200 transition-colors flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${game.winner === (game.whitePlayerId === user.id ? 'white' : 'black') ? 'bg-green-500' : game.winner === 'draw' ? 'bg-blue-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            vs {game.whitePlayerId === user.id ? game.blackPlayer?.displayName || game.blackPlayer?.username : game.whitePlayer?.displayName || game.whitePlayer?.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(game.createdAt).toLocaleDateString()} • {game.result || 'Finished'}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${game.winner === (game.whitePlayerId === user.id ? 'white' : 'black') ? 'text-green-600' : game.winner === 'draw' ? 'text-blue-600' : 'text-red-600'}`}>
                        {game.winner === (game.whitePlayerId === user.id ? 'white' : 'black') ? 'WIN' : game.winner === 'draw' ? 'DRAW' : 'LOSS'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-pink-50 rounded-3xl border border-dashed border-pink-200">
                    <p className="text-pink-400">No games played yet. Go find your first match! 💖</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default ProfilePage;
