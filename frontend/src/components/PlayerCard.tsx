import React from 'react';
import EloBadge from './EloBadge';
import FollowButton from './FollowButton';

interface PlayerCardProps {
  user: {
    id: string;
    username: string;
    displayName?: string;
    eloRating: number;
    profilePhoto?: string;
    country?: string;
  };
  showFollow?: boolean;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  user,
  showFollow = true,
  className = '',
}) => {
  const label = user.displayName || user.username;
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div
      className={`page-glass-card group relative flex h-full flex-col overflow-hidden rounded-[2.15rem] p-6 transition duration-500 hover:-translate-y-2 hover:shadow-[0_36px_90px_-40px_rgba(190,24,93,0.46)] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-rose-100/85 via-amber-50/75 to-transparent" />
      <div className="absolute -right-6 top-0 h-28 w-28 rounded-full bg-rose-200/35 blur-3xl transition duration-500 group-hover:scale-125" />
      <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/90 bg-gradient-to-br from-rose-100 via-white to-amber-50 text-xl font-black uppercase text-rose-600 shadow-[0_16px_36px_-24px_rgba(190,24,93,0.55)]">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-rose-600">
                {label}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-400">
                @{user.username}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {user.country || 'Global community'}
              </p>
            </div>
          </div>

          <span className="rounded-full border border-rose-100 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 shadow-sm">
            Open to play
          </span>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-500">
          Smooth on the clock, ready for a thoughtful match, and easy to find
          again when the board gets interesting.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <EloBadge rating={user.eloRating} />
          <span className="rounded-full border border-amber-100 bg-amber-50/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm">
            Match-ready
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-rose-100/80 bg-white/82 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Style
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Romantic rapid
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-rose-100/80 bg-white/82 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Region
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {user.country || 'Worldwide'}
            </p>
          </div>
        </div>

        {showFollow && (
          <div className="mt-6 border-t border-rose-100/70 pt-5">
            <FollowButton userId={user.id} className="w-full !rounded-[1.35rem] !py-3" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
