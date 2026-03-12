import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import RomanticLandingPage from './pages/RomanticLandingPage';
import PlayPage from './pages/PlayPage';
import GuidesPage from './pages/GuidesPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AchievementPopup from './components/AchievementPopup';
import PopunderAd from './components/PopunderAd';
import AdInjection from './components/AdInjection';

import { useGameStore } from './store/gameStore';
import api from './services/apiService';
import './App.css';
import { tokenStorage } from './services/tokenStorage';
import { socketService } from './services/socketService';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  const { user, token, setUser, isAuthLoading, setAuthLoading } = useGameStore();

  useEffect(() => {
    // If we have a token, we should always verify it and get the latest user data
    if (token) {
      setAuthLoading(true);
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setAuthLoading(false);
        })
        .catch((err) => {
          console.error('Auth verification failed:', err);
          // Only clear if it's a 401 Unauthorized, to avoid clearing on server errors
          if (err.response?.status === 401) {
            tokenStorage.clear();
            useGameStore.getState().setToken(null);
          }
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
    socketService.connect();
    // We only want this to run once on mount or when the token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (isAuthLoading) {
    return (
      <div className="page-center" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>💞</div>
          <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#2a1f21' }}>Authenticating…</div>
          <div style={{ opacity: 0.75, marginTop: 6, color: '#3f2e31' }}>Securing your session.</div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <AchievementPopup />
          <PopunderAd />
          <AdInjection />
          <Routes>
            <Route path="/" element={<RomanticLandingPage />} />
            <Route path="/play" element={token ? <PlayPage /> : <Navigate to="/login" />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route 
              path="/admin" 
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
