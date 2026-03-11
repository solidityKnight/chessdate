import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import { Search, User as UserIcon, ShieldCheck, ChevronRight, BarChart3, Database, Save, Heart } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/search?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (userId: string, credits: number) => {
    try {
      await api.post('/admin/users/credits', { userId, credits });
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, credits } : u));
      alert('Credits updated successfully');
    } catch (err) {
      console.error('Failed to update credits', err);
      alert('Failed to update credits');
    }
  };

  if (!user || user.role !== 'admin') return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">System Control Panel</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all border border-gray-600"
          >
            Back to Home
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex items-center space-x-4">
            <div className="bg-blue-500/10 p-4 rounded-xl text-blue-500">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-xs text-gray-500 uppercase">Total Users</p>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex items-center space-x-4">
            <div className="bg-green-500/10 p-4 rounded-xl text-green-500">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalGames || 0}</p>
              <p className="text-xs text-gray-500 uppercase">Total Games</p>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex items-center space-x-4">
            <div className="bg-purple-500/10 p-4 rounded-xl text-purple-500">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeGames || 0}</p>
              <p className="text-xs text-gray-500 uppercase">Active Games</p>
            </div>
          </div>
        </div>

        {/* User Search & Management */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-400" />
              User Management
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50 text-xs uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4 text-center">Credits</th>
                  <th className="px-6 py-4 text-center">Stats</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {searchResults.length > 0 ? (
                  searchResults.map((user, i) => (
                    <tr key={i} className="hover:bg-gray-700/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <input 
                            type="number"
                            defaultValue={user.credits}
                            id={`credits-${user.id}`}
                            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-sm"
                            min="0"
                            max="999"
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`credits-${user.id}`) as HTMLInputElement;
                              handleUpdateCredits(user.id, parseInt(input.value));
                            }}
                            className="p-1.5 bg-green-600/20 text-green-500 rounded hover:bg-green-600/30 transition-all"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs text-gray-300">
                          {user.stats.gamesPlayed} G | {user.stats.wins} W
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-500 hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      {searchQuery ? 'No users found matching your query.' : 'Search for users to manage their accounts.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
