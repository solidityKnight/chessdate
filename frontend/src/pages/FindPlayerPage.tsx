import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import PlayerCard from '../components/PlayerCard';

const FindPlayerPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/search?q=${query}`);
      setResults(response.data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  return (
    <RomanticLayout>
      <div className="max-w-6xl mx-auto px-4 py-16 animate-fade-in">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-1 rounded-full bg-pink-100 text-pink-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2 shadow-sm">
            Community Search
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 italic">Perfect</span> Opponent
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Discover fellow strategic minds in the kingdom. Connect, challenge, and grow together in the ultimate pursuit of <span className="text-pink-400 font-semibold italic">chess and connection</span>.
          </p>
        </div>

        <div className="relative max-w-2xl mx-auto mb-20 group">
          <div className="absolute inset-0 bg-pink-400/10 blur-2xl rounded-3xl group-hover:bg-pink-400/20 transition-all duration-500" />
          <input
            type="text"
            className="relative w-full p-6 pl-16 rounded-[2rem] bg-white/80 backdrop-blur-md border-2 border-pink-100 focus:border-pink-500 focus:ring-8 focus:ring-pink-500/10 outline-none transition-all shadow-xl text-lg font-medium placeholder:text-gray-300 placeholder:italic"
            placeholder="Search by username or display name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl group-hover:scale-110 transition-transform duration-300 grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100">🔍</span>
          {loading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {results.length > 0 ? (
            results.map((user) => (
              <PlayerCard key={user.id} user={user} className="animate-slide-up" />
            ))
          ) : query.length >= 2 && !loading ? (
            <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-pink-100 shadow-inner">
              <div className="text-5xl mb-4">😿</div>
              <h3 className="text-xl font-black text-gray-800 mb-1">No players found</h3>
              <p className="text-gray-400 italic">Try searching for something else, love.</p>
            </div>
          ) : (
            <div className="col-span-full py-32 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-pink-100 blur-3xl rounded-full opacity-50 animate-pulse" />
                <div className="relative text-6xl mb-6">♟️</div>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
                Enter at least <span className="text-pink-400 font-black">2 characters</span> to begin the search
              </p>
            </div>
          )}
        </div>
      </div>
    </RomanticLayout>
  );
};

export default FindPlayerPage;
