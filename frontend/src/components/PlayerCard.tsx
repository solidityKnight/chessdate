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
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-rose-100/80 bg-white/78 p-6 shadow-[0_24px_70px_-34px_rgba(190,24,93,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-rose-200 hover:shadow-[0_32px_90px_-36px_rgba(190,24,93,0.5)] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-rose-100/70 via-amber-50/50 to-transparent" />
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-rose-200/30 blur-2xl transition duration-500 group-hover:scale-125" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/80 bg-gradient-to-br from-rose-100 to-amber-50 text-xl font-black uppercase text-rose-600 shadow-lg">
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
              <h3 className="truncate text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-rose-600">
                {label}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-400">
                @{user.username}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {user.country || 'Global community'}
              </p>
            </div>
          </div>

          <span className="rounded-full border border-rose-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
            Active
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <EloBadge rating={user.eloRating} />
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
            Match-ready
          </span>
        </div>

        {showFollow && (
          <div className="mt-6 border-t border-rose-100/70 pt-5">
            <FollowButton userId={user.id} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
