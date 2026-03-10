import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import LandingPage from './pages/LandingPage';
import GamePage from './pages/GamePage';
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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;