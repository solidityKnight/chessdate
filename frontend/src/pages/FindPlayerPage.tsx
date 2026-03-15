import React, { useEffect, useState } from 'react';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import PlayerCard from '../components/PlayerCard';

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  eloRating: number;
  profilePhoto?: string;
  country?: string;
}

const suggestedQueries = ['Anand', 'Maya', 'Rapid', 'Coach'];

const searchTips = [
  'Search by username or display name.',
  'Two characters are enough to begin.',
  'Use specific names to narrow the board quickly.',
];

const FindPlayerPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmedQuery = query.trim();
  const readyToSearch = trimmedQuery.length >= 2;
  const resultSummary = loading
    ? 'Scanning the player pool...'
    : readyToSearch
      ? `${results.length} player${results.length === 1 ? '' : 's'} found`
      : 'Start with at least two characters';

  useEffect(() => {
    if (!readyToSearch) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get(
          `/users/search?q=${encodeURIComponent(trimmedQuery)}`
        );

        if (isActive) {
          setResults(response.data);
        }
      } catch (err) {
        console.error('Search failed', err);
        if (isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [readyToSearch, trimmedQuery]);

  return (
    <RomanticLayout>
      <div className="page-shell">
        <section className="page-hero-card px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-12 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Community search
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  Find players worth your next match.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Scout the community, compare profiles, and make your next game
                  feel intentional. Search works best with real names, handles,
                  and distinctive fragments.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Search status
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    {loading ? 'Searching...' : readyToSearch ? 'Live' : 'Idle'}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Results
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    {readyToSearch ? results.length : 0}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Suggested queries
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    {suggestedQueries.length} ready
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Best query
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    2+ characters
                  </p>
                </div>
              </div>
            </div>

            <div className="page-dark-card rounded-[2.35rem] p-6 text-white">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-rose-300/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />

              <div className="relative z-10 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                    Search notes
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Keep the player pool feeling easy to scan.
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Current query
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {readyToSearch ? trimmedQuery : 'Waiting for a clue'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Search mode
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {loading
                        ? 'Refreshing results'
                        : readyToSearch
                          ? 'Live discovery'
                          : 'Standby'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {searchTips.map((tip, index) => (
                    <div
                      key={tip}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-slate-200">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="page-glass-card relative z-10 mt-8 rounded-[2rem] p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                  Search
                </span>
                <input
                  type="text"
                  className="w-full rounded-[1.85rem] border border-rose-100 bg-white px-5 py-5 pl-24 text-base font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition duration-200 placeholder:text-slate-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50"
                  placeholder="Try a username, display name, or part of one..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Search results
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Players on the board
              </h2>
            </div>

            <div className="rounded-full border border-rose-100 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              {resultSummary}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading &&
              [...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="page-glass-card rounded-[2rem] p-6"
                >
                  <div className="animate-pulse space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-[1.4rem] bg-rose-100" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded-full bg-rose-100" />
                          <div className="h-3 w-20 rounded-full bg-rose-50" />
                        </div>
                      </div>
                      <div className="h-7 w-20 rounded-full bg-rose-50" />
                    </div>
                    <div className="h-8 w-28 rounded-full bg-rose-100" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 rounded-[1.3rem] bg-rose-50" />
                      <div className="h-16 rounded-[1.3rem] bg-rose-50" />
                    </div>
                    <div className="h-10 rounded-[1rem] bg-rose-100" />
                  </div>
                </div>
              ))}

            {!loading &&
              readyToSearch &&
              results.map((user) => (
                <PlayerCard key={user.id} user={user} className="animate-slide-up" />
              ))}
          </div>

          {!loading && !readyToSearch && (
            <div className="page-dashed-card mt-6 rounded-[2.5rem] p-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Ready when you are
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                Start with a name, handle, or clue.
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
                Search opens once you type two or more characters. From there,
                the results update automatically.
              </p>
            </div>
          )}

          {!loading && readyToSearch && results.length === 0 && (
            <div className="page-glass-card mt-6 rounded-[2.5rem] p-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                No matches yet
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                No players matched "{trimmedQuery}".
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
                Try a shorter fragment, switch from full name to username, or use
                one of the suggested searches above.
              </p>
            </div>
          )}
        </section>
      </div>
    </RomanticLayout>
  );
};

export default FindPlayerPage;
