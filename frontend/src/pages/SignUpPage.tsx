import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
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
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        gender 
      });
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
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <RomanticLayout showNavbar={false}>
      <div className="page-center">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>💗</div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#2a1f21', marginBottom: 6 }}>
              Join ChessDate
            </h1>
            <p style={{ opacity: 0.75, color: '#3f2e31' }}>Play chess, find love</p>
          </div>

          {error && (
            <div className="message" style={{ borderRadius: 18, marginBottom: 14 }}>
              <span>Oops:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="chess_master" required minLength={3} />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <div className="field">
              <label>Gender</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <RomanticButton variant={gender === 'male' ? 'primary' : 'secondary'} type="button" onClick={() => setGender('male')}>
                  Male
                </RomanticButton>
                <RomanticButton variant={gender === 'female' ? 'primary' : 'secondary'} type="button" onClick={() => setGender('female')}>
                  Female
                </RomanticButton>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <RomanticButton variant="primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </RomanticButton>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, color: '#3f2e31', opacity: 0.75 }}>
            Already have an account? <Link to="/login" className="helper-link">Log In</Link>
          </p>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default SignUpPage;
