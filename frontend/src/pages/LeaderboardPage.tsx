import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import EloBadge from '../components/EloBadge';
import DiscoveryFilters from '../components/DiscoveryFilters';
import type { PlayerFilters, SocialUser } from '../types/social';
import { DEFAULT_PLAYER_FILTERS } from '../types/social';
import { buildDiscoveryParams, formatLastActive } from '../utils/social';

const getWinRate = (player: SocialUser) => {
  const totalGames = (player.wins || 0) + (player.losses || 0) + (player.draws || 0);
  return totalGames > 0 ? Math.round(((player.wins || 0) / totalGames) * 100) : 0;
};

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_PLAYER_FILTERS);

  useEffect(() => {
    let active = true;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const params = buildDiscoveryParams(null, filters);
        const response = await api.get(`/leaderboard?${params.toString()}`);

        if (active) {
          setPlayers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      active = false;
    };
  }, [filters]);

  const leader = players[0];
  const averageElo = players.length
    ? Math.round(
        players.reduce((total, player) => total + (player.eloRating || 0), 0) /
          players.length,
      )
    : 0;
  const countryCount = new Set(players.map((player) => player.country).filter(Boolean)).size;
  const highestWinRate = players.reduce(
    (best, player) => Math.max(best, getWinRate(player)),
    0,
  );
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  return (
    <RomanticLayout>
      <div className="page-shell">
        <section className="page-hero-card px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -left-14 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.16fr_0.84fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Season standings
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  Leaderboard built like a main event.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Rank the strongest players, then filter the table by trust, reach,
                  and message availability so the leaderboard can double as discovery.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Contenders
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : players.length}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Average elo
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : averageElo}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Countries
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : countryCount}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Active filters
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {activeFilterCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="page-dark-card rounded-[2.35rem] p-6 text-white">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-rose-300/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />

              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                  Leader spotlight
                </p>

                {leader ? (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/10 text-2xl font-black uppercase text-rose-200">
                        {leader.profilePhoto ? (
                          <img
                            src={leader.profilePhoto}
                            alt={leader.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          leader.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">
                          {leader.displayName || leader.username}
                        </h2>
                        <p className="mt-1 text-sm text-slate-300">
                          {leader.country || 'Global community'}
                        </p>
                      </div>
                    </div>

                    <EloBadge
                      rating={leader.eloRating || 1200}
                      className="border-white/10 bg-white/10 text-white [&>span:first-child]:bg-white/15 [&>span:last-child]:text-white"
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Win rate
                        </p>
                        <p className="mt-2 text-xl font-black">{getWinRate(leader)}%</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Last active
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {formatLastActive(leader.lastActiveAt, leader.isOnline)}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Top win rate
                        </p>
                        <p className="mt-2 text-xl font-black">{highestWinRate}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-base leading-8 text-slate-300">
                    Once matches start rolling in, the current leader will appear
                    here with a snapshot of the best record on the board.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <DiscoveryFilters filters={filters} onChange={setFilters} />
          </div>
        </section>

        <section className="page-glass-card mt-10 overflow-hidden rounded-[2.5rem]">
          <div className="flex flex-col gap-4 border-b border-rose-100/80 px-6 py-6 md:flex-row md:items-end md:justify-between md:px-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Full table
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Live standings
              </h2>
            </div>

            <div className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              Updated after every completed match
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6 md:p-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[1.75rem] border border-rose-100/70 bg-white/80 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-rose-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded-full bg-rose-100" />
                      <div className="h-3 w-24 rounded-full bg-rose-50" />
                    </div>
                    <div className="h-8 w-24 rounded-full bg-rose-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : players.length > 0 ? (
            <div className="space-y-4 p-6 md:p-8">
              {players.map((player, index) => {
                const winRate = getWinRate(player);

                return (
                  <article
                    key={player.id}
                    className="rounded-[1.9rem] border border-rose-100/80 bg-white/88 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black tracking-tight text-slate-300">
                          #{index + 1}
                        </span>
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white bg-white text-lg font-black uppercase text-rose-600 shadow-sm">
                          {player.profilePhoto ? (
                            <img
                              src={player.profilePhoto}
                              alt={player.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            player.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-lg font-black text-slate-900">
                              {player.displayName || player.username}
                            </p>
                            {player.isOnline && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                Online
                              </span>
                            )}
                            {player.canMessage && (
                              <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">
                                Can message
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-slate-400">
                            @{player.username}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {player.country || 'Global community'} -{' '}
                            {formatLastActive(player.lastActiveAt, player.isOnline)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                        <div className="rounded-[1.35rem] border border-rose-100 bg-rose-50/60 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Rating
                          </p>
                          <div className="mt-2">
                            <EloBadge rating={player.eloRating || 1200} />
                          </div>
                        </div>
                        <div className="rounded-[1.35rem] border border-rose-100 bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Record
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {player.wins || 0}W / {player.losses || 0}L / {player.draws || 0}D
                          </p>
                        </div>
                        <div className="rounded-[1.35rem] border border-rose-100 bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Win rate
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">{winRate}%</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center md:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                No standings yet
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                The board is waiting for its first result.
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
                As soon as completed matches are recorded, the leaderboard will
                populate here with a full ranking table and discovery-friendly filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </RomanticLayout>
  );
};

export default LeaderboardPage;
