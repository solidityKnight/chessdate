import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EloBadge from './EloBadge';
import FollowButton from './FollowButton';
import api from '../services/apiService';
import type { SaveKind, SocialUser } from '../types/social';
import { describeMatchPreferences, formatLastActive } from '../utils/social';

interface PlayerCardProps {
  user: SocialUser;
  showFollow?: boolean;
  className?: string;
  onActionComplete?: () => void;
}

const parseApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data
  ) {
    return String(error.response.data.message);
  }

  return fallback;
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  user,
  showFollow = true,
  className = '',
  onActionComplete,
}) => {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(Boolean(user.isMuted));
  const [blocked, setBlocked] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [savedKinds, setSavedKinds] = useState<SaveKind[]>(
    (user.savedKinds || []).filter(
      (value): value is SaveKind => value === 'favorite' || value === 'rematch_later',
    ),
  );

  const label = user.displayName || user.username;
  const initial = user.username.charAt(0).toUpperCase();
  const totalGames = (user.wins || 0) + (user.losses || 0) + (user.draws || 0);
  const winRate = totalGames > 0 ? Math.round(((user.wins || 0) / totalGames) * 100) : 0;
  const followStatus = useMemo<'none' | 'pending' | 'accepted'>(() => {
    if (user.canMessage || user.followsYou) {
      return 'accepted';
    }
    return 'none';
  }, [user.canMessage, user.followsYou]);

  const toggleSave = async (kind: SaveKind) => {
    setLoadingAction(kind);
    try {
      const alreadySaved = savedKinds.includes(kind);

      if (alreadySaved) {
        await api.delete('/saved-players', {
          data: {
            targetUserId: user.id,
            kind,
          },
        });
        setSavedKinds((current) => current.filter((value) => value !== kind));
      } else {
        await api.post('/saved-players', {
          targetUserId: user.id,
          kind,
        });
        setSavedKinds((current) => [...current, kind]);
      }

      onActionComplete?.();
    } catch (error: unknown) {
      window.alert(parseApiErrorMessage(error, 'Could not update saved players.'));
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleSafetyAction = async (type: 'mute' | 'block') => {
    const isActive = type === 'mute' ? muted : blocked;

    if (type === 'block' && !isActive) {
      const confirmed = window.confirm(
        `Block ${label}? They will no longer be able to follow, message, or match with you.`,
      );

      if (!confirmed) {
        return;
      }
    }

    setLoadingAction(type);

    try {
      if (isActive) {
        await api.delete(`/safety/action/${type}/${user.id}`);
      } else {
        await api.post('/safety/action', {
          targetUserId: user.id,
          type,
        });
      }

      if (type === 'mute') {
        setMuted(!isActive);
      } else {
        setBlocked(!isActive);
      }

      onActionComplete?.();
    } catch (error: unknown) {
      window.alert(parseApiErrorMessage(error, `Could not ${type} this player.`));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt(`Tell us why you want to report ${label}.`);
    if (!reason?.trim()) return;

    setLoadingAction('report');

    try {
      await api.post('/safety/report', {
        targetUserId: user.id,
        reason: reason.trim(),
      });
      window.alert('Report submitted. Thank you for helping keep the app safe.');
    } catch (error: unknown) {
      window.alert(parseApiErrorMessage(error, 'Could not submit your report.'));
    } finally {
      setLoadingAction(null);
    }
  };

  const availabilityBadge = blocked
    ? 'Blocked'
    : user.isOnline
      ? 'Online now'
      : user.canMessage
        ? 'Message-ready'
        : 'Open to meet';

  return (
    <div
      className={`page-glass-card group relative flex h-full flex-col overflow-hidden rounded-[2.15rem] p-6 transition duration-500 hover:-translate-y-2 hover:shadow-[0_36px_90px_-40px_rgba(190,24,93,0.46)] ${className} ${muted ? 'opacity-80' : ''}`}
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
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                  user.isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                }`}
              />
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

          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
              blocked
                ? 'border-slate-200 bg-slate-100 text-slate-500'
                : user.isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-100 bg-white/85 text-rose-500'
            }`}
          >
            {availabilityBadge}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <EloBadge rating={user.eloRating || 1200} />
          {user.isProfilePhotoVerified && (
            <span className="rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700 shadow-sm">
              Verified photo
            </span>
          )}
          {user.mutualFollow && (
            <span className="rounded-full border border-amber-100 bg-amber-50/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm">
              Mutual follow
            </span>
          )}
          {muted && (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm">
              Muted
            </span>
          )}
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-500">
          Last active {formatLastActive(user.lastActiveAt, user.isOnline)}. Match preference:{' '}
          {describeMatchPreferences(user.matchPreferences)}.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-rose-100/80 bg-white/82 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Completion
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {user.profileCompletion || 0}% profile
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-rose-100/80 bg-white/82 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Win rate
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {winRate}% over {totalGames} games
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {user.canMessage && !blocked && (
            <button
              type="button"
              onClick={() => navigate(`/friends?contact=${user.id}`)}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Message
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleSave('favorite')}
            disabled={loadingAction === 'favorite' || blocked}
            className="rounded-full border border-amber-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-600 transition hover:border-amber-200 hover:bg-amber-50 disabled:opacity-60"
          >
            {savedKinds.includes('favorite') ? 'Favorited' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={() => toggleSave('rematch_later')}
            disabled={loadingAction === 'rematch_later' || blocked}
            className="rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-600 transition hover:border-sky-200 hover:bg-sky-50 disabled:opacity-60"
          >
            {savedKinds.includes('rematch_later') ? 'Saved rematch' : 'Rematch later'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => toggleSafetyAction('mute')}
            disabled={loadingAction === 'mute' || blocked}
            className="rounded-[1rem] border border-rose-100 bg-white/82 px-3 py-3 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={() => toggleSafetyAction('block')}
            disabled={loadingAction === 'block'}
            className="rounded-[1rem] border border-rose-100 bg-white/82 px-3 py-3 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
          >
            {blocked ? 'Unblock' : 'Block'}
          </button>
          <button
            type="button"
            onClick={handleReport}
            disabled={loadingAction === 'report' || blocked}
            className="rounded-[1rem] border border-rose-100 bg-white/82 px-3 py-3 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
          >
            Report
          </button>
        </div>

        {showFollow && !blocked && (
          <div className="mt-6 border-t border-rose-100/70 pt-5">
            <FollowButton
              userId={user.id}
              initialStatus={followStatus}
              onStatusChange={() => onActionComplete?.()}
              className="w-full !rounded-[1.35rem] !py-3"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
