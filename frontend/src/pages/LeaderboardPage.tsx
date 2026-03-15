import React, { useEffect, useState } from 'react';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import EloBadge from '../components/EloBadge';

interface LeaderboardPlayer {
  id: number | string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
  country?: string;
  eloRating: number;
  wins: number;
  losses: number;
  draws: number;
}

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/leaderboard');
        setPlayers(response.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const leader = players[0];
  const averageElo = players.length
    ? Math.round(
        players.reduce((total, player) => total + player.eloRating, 0) /
          players.length
      )
    : 0;
  const countryCount = new Set(
    players.map((player) => player.country).filter(Boolean)
  ).size;
  const highestWinRate = players.reduce((best, player) => {
    const totalGames = player.wins + player.losses + player.draws;
    const winRate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;
    return Math.max(best, winRate);
  }, 0);

  const podiumEntries = [
    players[1]
      ? {
          player: players[1],
          place: 2,
          label: 'Close behind',
          cardClass:
            'border-slate-200/80 bg-white/90 md:mt-10 hover:shadow-[0_40px_80px_-30px_rgba(148,163,184,0.3)] transition-all duration-500',
          accentClass: 'bg-slate-100 text-slate-700 border border-slate-200',
          haloClass: 'bg-slate-200/50',
        }
      : null,
    players[0]
      ? {
          player: players[0],
          place: 1,
          label: 'Current leader',
          cardClass:
            'border-amber-200/90 bg-gradient-to-b from-white via-amber-25/50 to-amber-50/90 md:-mt-8 scale-105 z-20 shadow-[0_50px_100px_-30px_rgba(245,158,11,0.35)] hover:shadow-[0_60px_120px_-40px_rgba(245,158,11,0.45)] transition-all duration-500',
          accentClass: 'bg-amber-100 text-amber-700 border border-amber-200',
          haloClass: 'bg-amber-300/40',
        }
      : null,
    players[2]
      ? {
          player: players[2],
          place: 3,
          label: 'Holding pace',
          cardClass:
            'border-orange-200/80 bg-white/90 md:mt-14 hover:shadow-[0_40px_80px_-30px_rgba(249,115,22,0.3)] transition-all duration-500',
          accentClass: 'bg-orange-100 text-orange-700 border border-orange-200',
          haloClass: 'bg-orange-200/50',
        }
      : null,
  ].filter(Boolean) as Array<{
    player: LeaderboardPlayer;
    place: number;
    label: string;
    cardClass: string;
    accentClass: string;
    haloClass: string;
  }>;

  return (
    <RomanticLayout>
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-rose-100/80 bg-white/78 px-6 py-8 shadow-[0_30px_100px_-45px_rgba(190,24,93,0.45)] backdrop-blur-xl md:px-10 md:py-10">
          <div className="absolute -left-14 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Season standings
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  Leaderboard built like a main event.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Track the strongest players in the room, compare records at a
                  glance, and see who is converting good positions into real
                  results.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Contenders
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : players.length}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Average elo
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : averageElo}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Countries
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : countryCount}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Top win rate
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? '--' : `${highestWinRate}%`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-slate-900 p-6 text-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.95)]">
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
                    rating={leader.eloRating}
                    className="border-white/10 bg-white/10 text-white [&>span:first-child]:bg-white/15 [&>span:last-child]:text-white"
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Wins
                      </p>
                      <p className="mt-2 text-xl font-black">{leader.wins}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Losses
                      </p>
                      <p className="mt-2 text-xl font-black">{leader.losses}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Draws
                      </p>
                      <p className="mt-2 text-xl font-black">{leader.draws}</p>
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
        </section>

        {loading ? (
          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="rounded-[2.25rem] border border-rose-100/80 bg-white/78 p-6 shadow-[0_20px_70px_-40px_rgba(190,24,93,0.4)]"
              >
                <div className="animate-pulse space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="h-7 w-24 rounded-full bg-rose-100" />
                    <div className="h-7 w-10 rounded-full bg-rose-50" />
                  </div>
                  <div className="h-20 w-20 rounded-[1.5rem] bg-rose-100" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded-full bg-rose-100" />
                    <div className="h-4 w-24 rounded-full bg-rose-50" />
                  </div>
                  <div className="h-10 w-28 rounded-full bg-rose-100" />
                  <div className="h-2 rounded-full bg-rose-50" />
                </div>
              </div>
            ))}
          </section>
        ) : players.length > 0 ? (
          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {podiumEntries.map(
              ({
                player,
                place,
                label,
                cardClass,
                accentClass,
                haloClass,
              }) => {
                const totalGames = player.wins + player.losses + player.draws;
                const winRate =
                  totalGames > 0
                    ? Math.round((player.wins / totalGames) * 100)
                    : 0;

                return (
                  <article
                    key={player.id}
                    className={`relative overflow-hidden rounded-[2.25rem] border p-6 shadow-[0_24px_70px_-40px_rgba(190,24,93,0.42)] backdrop-blur-xl ${cardClass}`}
                  >
                    <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${haloClass}`} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${accentClass}`}>
                          {label}
                        </span>
                        <span className="text-4xl font-black tracking-tight text-slate-300">
                          {place}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/80 bg-white text-2xl font-black uppercase text-rose-600 shadow-lg">
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
                          <h3 className="truncate text-2xl font-black tracking-tight text-slate-900">
                            {player.displayName || player.username}
                          </h3>
                          <p className="mt-1 truncate text-sm font-medium text-slate-400">
                            @{player.username}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {player.country || 'Global community'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <EloBadge rating={player.eloRating} />
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                          <span>Win rate</span>
                          <span>{winRate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-rose-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            W
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            {player.wins}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            L
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            {player.losses}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            D
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            {player.draws}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        ) : null}

        <section className="mt-10 overflow-hidden rounded-[2.5rem] border border-rose-100/80 bg-white/80 shadow-[0_30px_100px_-50px_rgba(190,24,93,0.42)] backdrop-blur-xl">
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
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-rose-100/80 bg-rose-50/60">
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Rank
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Player
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Rating
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Record
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Win rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => {
                      const totalGames = player.wins + player.losses + player.draws;
                      const winRate =
                        totalGames > 0
                          ? Math.round((player.wins / totalGames) * 100)
                          : 0;

                      return (
                        <tr
                          key={player.id}
                          className="border-b border-rose-100/60 transition duration-200 hover:bg-rose-50/40"
                        >
                          <td className="px-8 py-5 text-lg font-black tracking-tight text-slate-300">
                            #{String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-white bg-white text-sm font-black uppercase text-rose-600 shadow-sm">
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
                                <p className="truncate text-sm font-black text-slate-900">
                                  {player.displayName || player.username}
                                </p>
                                <p className="mt-1 truncate text-xs font-medium text-slate-400">
                                  @{player.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <EloBadge rating={player.eloRating} />
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                                {player.wins}
                              </span>
                              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
                                {player.losses}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                {player.draws}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-28 rounded-full bg-rose-100">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-black text-slate-700">
                                {winRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-6 md:hidden">
                {players.map((player, index) => {
                  const totalGames = player.wins + player.losses + player.draws;
                  const winRate =
                    totalGames > 0
                      ? Math.round((player.wins / totalGames) * 100)
                      : 0;

                  return (
                    <article
                      key={player.id}
                      className="rounded-[1.75rem] border border-rose-100/80 bg-white/80 p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1rem] border border-white bg-white text-lg font-black uppercase text-rose-600 shadow-sm">
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
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {player.displayName || player.username}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              @{player.username}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-black tracking-tight text-slate-300">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="mt-4">
                        <EloBadge rating={player.eloRating} />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-[1.25rem] bg-emerald-50 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                            W
                          </p>
                          <p className="mt-2 text-lg font-black text-emerald-700">
                            {player.wins}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-rose-50 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
                            L
                          </p>
                          <p className="mt-2 text-lg font-black text-rose-700">
                            {player.losses}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-slate-100 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                            D
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-700">
                            {player.draws}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                          <span>Win rate</span>
                          <span>{winRate}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-rose-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
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
                populate here with a full ranking table and podium view.
              </p>
            </div>
          )}
        </section>
      </div>
    </RomanticLayout>
  );
};

export default LeaderboardPage;
