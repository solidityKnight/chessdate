import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';

const AdminDashboard: React.FC = () => {
  const { user } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sort, setSort] = useState<'username_asc' | 'username_desc' | 'created_desc' | 'created_asc'>('username_asc');
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

    const fetchUsers = async () => {
      try {
        const response = await api.get(`/admin/users?sort=${sort}`);
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchStats();
    fetchUsers();
  }, [sort]);

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
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits } : u));
      alert('Credits updated successfully');
    } catch (err) {
      console.error('Failed to update credits', err);
      alert('Failed to update credits');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <RomanticLayout>
        <div className="page-center">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🛡️</div>
            <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#2a1f21' }}>Unauthorized</div>
            <div style={{ opacity: 0.75, marginTop: 6, color: '#3f2e31' }}>Admin access required.</div>
          </div>
        </div>
      </RomanticLayout>
    );
  }

  const visibleUsers = searchQuery.trim() ? searchResults : users;

  return (
    <RomanticLayout>
      <div className="page-center">
        <div className="card" style={{ width: 'min(1080px, 92vw)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2a1f21' }}>Admin Dashboard</div>
              <div style={{ opacity: 0.75, color: '#3f2e31', marginTop: 4 }}>System Control Panel</div>
            </div>
            <RomanticButton variant="secondary" onClick={() => navigate('/')}>Back to Home</RomanticButton>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 18 }}>
            <div className="message" style={{ borderRadius: 18 }}><span>Total Users:</span> {stats?.totalUsers || 0}<div className="timestamp">overview</div></div>
            <div className="message" style={{ borderRadius: 18 }}><span>Total Games:</span> {stats?.totalGames || 0}<div className="timestamp">overview</div></div>
            <div className="message" style={{ borderRadius: 18 }}><span>Active Games:</span> {stats?.activeGames || 0}<div className="timestamp">overview</div></div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4d2f35', marginBottom: 4 }}>User Management</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, color: '#5b3a40' }}>
                  Browse all users or refine with search.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#5b3a40' }}>Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid #ffdae2',
                    borderRadius: 16,
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    color: '#2d2325',
                  }}
                >
                  <option value="username_asc">Username A–Z</option>
                  <option value="username_desc">Username Z–A</option>
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                style={{
                  flex: 1,
                  minWidth: 240,
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid #ffdae2',
                  borderRadius: 22,
                  padding: '12px 14px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#2d2325',
                }}
              />
              <RomanticButton variant="primary" type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </RomanticButton>
            </form>
          </div>

          <div style={{ marginTop: 14 }}>
            {visibleUsers.length === 0 ? (
              <div className="message" style={{ borderRadius: 18 }}>
                <span>{searchQuery ? 'Search:' : 'Users:'}</span>{' '}
                {searchQuery
                  ? 'No users found matching your query.'
                  : 'No users found in the system yet.'}
                <div className="timestamp">admin</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                {visibleUsers.map((u) => (
                  <div key={u.id} className="chat-box" style={{ width: '100%' }}>
                    <h3>{u.username}</h3>
                    <div className="message"><span>Email:</span> {u.email}<div className="timestamp">user</div></div>
                    <div className="message">
                      <span>Stats:</span>{' '}
                      {u.stats?.gamesPlayed || u.gamesPlayed || 0} G • {u.stats?.wins || u.wins || 0} W
                      <div className="timestamp">user</div>
                    </div>

                    <div className="chat-input">
                      <input id={`credits-${u.id}`} defaultValue={u.credits} type="number" min={0} max={999} />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`credits-${u.id}`) as HTMLInputElement | null;
                          if (!input) return;
                          const value = Number.parseInt(input.value, 10);
                          if (Number.isNaN(value)) return;
                          handleUpdateCredits(u.id, value);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default AdminDashboard;
