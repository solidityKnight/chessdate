import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import AdBanner from '../components/AdBanner';

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

  if (!user || loading) {
    return (
      <RomanticLayout>
        <div className="page-center">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🌸</div>
            <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#2a1f21' }}>Loading Profile…</div>
            <div style={{ opacity: 0.75, marginTop: 6, color: '#3f2e31' }}>One moment while we fetch your love stats.</div>
          </div>
        </div>
      </RomanticLayout>
    );
  }

  const stats = user.stats || { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winStreak: 0, maxWinStreak: 0 };
  const achievements = user.achievements || [];

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
    : 0;

  return (
    <RomanticLayout>
      <div className="page-center" style={{ paddingBottom: '120px' }}>
        <div className="card" style={{ width: 'min(980px, 92vw)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: '#ffeef2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  fontWeight: 700,
                  color: '#2d2325',
                  border: '1px solid #ffdae2',
                  boxShadow: 'inset 0 1px 3px #fff',
                }}
              >
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2a1f21' }}>{user.username}</div>
                <div style={{ opacity: 0.75, color: '#3f2e31', marginTop: 2 }}>Gender: <b style={{ color: '#c63e5c' }}>{user.gender}</b></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {user.role === 'admin' && (
                <RomanticButton variant="secondary" onClick={() => navigate('/admin')}>Admin Panel</RomanticButton>
              )}
              <RomanticButton variant="danger" onClick={handleLogout}>Logout</RomanticButton>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 22 }}>
            <div className="chat-box" style={{ width: '100%' }}>
              <h3>Credits</h3>
              <div className="message"><span>Credits:</span> {user.credits} / 5<div className="timestamp">regen</div></div>
              <div className="message"><span>Used:</span> {user.gamesPlayedInCredit} / 5 games<div className="timestamp">this cycle</div></div>
            </div>

            <div className="chat-box" style={{ width: '100%' }}>
              <h3>Stats</h3>
              <div className="message"><span>Games:</span> {stats.gamesPlayed}<div className="timestamp">total</div></div>
              <div className="message"><span>Wins:</span> {stats.wins} • <span>Losses:</span> {stats.losses}<div className="timestamp">record</div></div>
              <div className="message"><span>Win Rate:</span> {winRate}%<div className="timestamp">sweet</div></div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4d2f35', marginBottom: 12 }}>Achievements</div>
            {achievements.length === 0 ? (
              <div className="message"><span>None yet:</span> Keep playing to unlock romantic badges.<div className="timestamp">soon</div></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {achievements.map((a: any, i: number) => (
                  <div key={i} className="message" style={{ borderRadius: 18 }}>
                    <span>{a.name}:</span> {a.description}
                    <div className="timestamp">unlocked</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4d2f35', marginBottom: 12 }}>Recent Games</div>
            {recentGames.length === 0 ? (
              <div className="message"><span>Quiet board:</span> No recent games found.<div className="timestamp">—</div></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {recentGames.slice(0, 6).map((game, i) => (
                  <div key={i} className="message" style={{ borderRadius: 18 }}>
                    <span>Game:</span> {new Date(game.startedAt).toLocaleDateString()}
                    <div className="timestamp">{game.result || 'played'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mobile-ad-spacer"></div>
      </div>

      <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <AdBanner />
        </div>
      </div>
    </RomanticLayout>
  );
};

export default ProfilePage;
