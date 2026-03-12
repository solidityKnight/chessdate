import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import AdBanner from '../components/AdBanner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setToken = useGameStore(state => state.setToken);
  const setUser = useGameStore(state => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);
      navigate('/');
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidation = Array.isArray(data?.errors) ? data.errors[0]?.msg : null;
      const isNetwork = err?.message === 'Network Error' || err?.code === 'ERR_NETWORK';
      setError(
        data?.message ||
          firstValidation ||
          (isNetwork ? 'Network Error: Cannot reach the server from this browser. Check backend URL / CORS / HTTPS.' : null) ||
          err?.message ||
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <RomanticLayout showNavbar={false}>
      <div className="page-center" style={{ paddingBottom: '120px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>❤️</div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#2a1f21', marginBottom: 6 }}>
              Welcome Back
            </h1>
            <p style={{ opacity: 0.75, color: '#3f2e31' }}>Sign in to ChessDate</p>
          </div>

          {error && (
            <div className="message" style={{ borderRadius: 18, marginBottom: 14 }}>
              <span>Oops:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <div style={{ marginTop: 20 }}>
              <RomanticButton variant="primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </RomanticButton>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, color: '#3f2e31', opacity: 0.75 }}>
            Don&apos;t have an account? <Link to="/signup" className="helper-link">Sign Up</Link>
          </p>
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

export default LoginPage;
