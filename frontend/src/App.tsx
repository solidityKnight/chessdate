import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AchievementPopup from './components/AchievementPopup';
import { useGameStore } from './store/gameStore';
import api from './services/apiService';
import './App.css';

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
    if (token && !user) {
      setAuthLoading(true);
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          useGameStore.getState().setToken(null);
          setAuthLoading(false);
        });
    } else if (!token) {
      setAuthLoading(false);
    }
  }, [token, user, setUser, setAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App h-screen overflow-hidden bg-gray-900 text-white flex flex-col">
          <AchievementPopup />
          <Routes>
            <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/signup" element={!token ? <SignUpPage /> : <Navigate to="/" />} />
            
            <Route path="/" element={token ? <LandingPage /> : <Navigate to="/login" />} />
            <Route path="/game/:gameId" element={token ? <GamePage /> : <Navigate to="/login" />} />
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