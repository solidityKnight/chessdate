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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Opponent 🔍</h1>
          <p className="text-gray-500">Search for other chess players and make new friends.</p>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            className="w-full p-4 pl-12 rounded-2xl border-2 border-pink-100 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 outline-none transition-all shadow-sm"
            placeholder="Search by username or display name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale opacity-50">🔍</span>
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.length > 0 ? (
            results.map((user) => (
              <PlayerCard key={user.id} user={user} />
            ))
          ) : query.length >= 2 && !loading ? (
            <div className="col-span-2 py-12 text-center bg-pink-50 rounded-3xl border border-dashed border-pink-200">
              <p className="text-pink-400">No players found matching "{query}"</p>
            </div>
          ) : (
            <div className="col-span-2 py-12 text-center text-gray-400 italic">
              Type at least 2 characters to start searching...
            </div>
          )}
        </div>
      </div>
    </RomanticLayout>
  );
};

export default FindPlayerPage;
