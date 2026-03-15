import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import EloBadge from '../components/EloBadge';
import type { SavedPlayerEntry, SocialUser } from '../types/social';
import { describeMatchPreferences, formatLastActive } from '../utils/social';

interface RecentGamePlayer {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
}

interface RecentGame {
  id?: string;
  whitePlayerId: string;
  blackPlayerId: string;
  whitePlayer?: RecentGamePlayer;
  blackPlayer?: RecentGamePlayer;
  winner: string;
  result: string;
  createdAt: string;
}

interface EditProfileForm {
  displayName: string;
  age: string;
  bio: string;
  city: string;
  country: string;
  interests: string;
  profilePhoto: string;
  learnMode: boolean;
  preferredMatchDistance: string;
  matchPreferences: Array<'male' | 'female'>;
}

const profileFieldClassName =
  'w-full rounded-[1.35rem] border border-rose-100 bg-white/82 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition duration-300 placeholder:text-slate-300 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-300/15';

const buildEditData = (source?: ReturnType<typeof useGameStore.getState>['user'] | null): EditProfileForm => ({
  displayName: source?.displayName || '',
  age: source?.age ? String(source.age) : '',
  bio: source?.bio || '',
  city: source?.city || '',
  country: source?.country || '',
  interests: Array.isArray(source?.interests) ? source!.interests.join(', ') : '',
  profilePhoto: source?.profilePhoto || '',
  learnMode: source?.learnMode ?? true,
  preferredMatchDistance:
    source?.preferredMatchDistance !== undefined ? String(source.preferredMatchDistance) : '',
  matchPreferences:
    source?.matchPreferences && source.matchPreferences.length > 0
      ? source.matchPreferences
      : ['male', 'female'],
});

const connectionTabs = [
  { key: 'followers', label: 'Followers' },
  { key: 'following', label: 'Following' },
  { key: 'pending_followers', label: 'Requests' },
  { key: 'pending_following', label: 'Outgoing' },
] as const;

type ConnectionsTab = (typeof connectionTabs)[number]['key'];

const ProfilePage: React.FC = () => {
  const { user, setUser, setToken } = useGameStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditProfileForm>(buildEditData(user));
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [pendingFollowers, setPendingFollowers] = useState<SocialUser[]>([]);
  const [pendingFollowing, setPendingFollowing] = useState<SocialUser[]>([]);
  const [favorites, setFavorites] = useState<SavedPlayerEntry[]>([]);
  const [rematchLater, setRematchLater] = useState<SavedPlayerEntry[]>([]);
  const [activeConnectionsTab, setActiveConnectionsTab] =
    useState<ConnectionsTab>('followers');

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const [
          profileRes,
          followersRes,
          followingRes,
          pendingFollowersRes,
          pendingFollowingRes,
          favoritesRes,
          rematchLaterRes,
        ] = await Promise.all([
          api.get('/user/profile'),
          api.get('/follow/list?type=followers'),
          api.get('/follow/list?type=following'),
          api.get('/follow/list?type=pending_followers'),
          api.get('/follow/list?type=pending_following'),
          api.get('/saved-players?kind=favorite'),
          api.get('/saved-players?kind=rematch_later'),
        ]);

        if (!active) return;

        setRecentGames(profileRes.data.recentGames || []);
        setUser(profileRes.data.user);
        setEditData(buildEditData(profileRes.data.user));
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
        setPendingFollowers(pendingFollowersRes.data);
        setPendingFollowing(pendingFollowingRes.data);
        setFavorites(favoritesRes.data);
        setRematchLater(rematchLaterRes.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [setUser]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/user/profile', {
        ...editData,
        age: editData.age ? Number(editData.age) : null,
        interests: editData.interests
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        preferredMatchDistance: editData.preferredMatchDistance
          ? Number(editData.preferredMatchDistance)
          : null,
      });

      setUser(response.data.user);
      setEditData(buildEditData(response.data.user));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const handleAcceptFollower = async (followerId: string) => {
    try {
      await api.post('/follow/accept', { followerId });
      const acceptedUser = pendingFollowers.find((entry) => entry.id === followerId);
      setPendingFollowers((current) => current.filter((entry) => entry.id !== followerId));
      if (acceptedUser) {
        setFollowers((current) => [acceptedUser, ...current]);
      }
      setActiveConnectionsTab('followers');
    } catch (error) {
      console.error('Failed to accept follow', error);
    }
  };

  const handleRemoveSavedPlayer = async (
    targetUserId: string,
    kind: 'favorite' | 'rematch_later',
  ) => {
    try {
      await api.delete('/saved-players', {
        data: {
          targetUserId,
          kind,
        },
      });

      if (kind === 'favorite') {
        setFavorites((current) => current.filter((entry) => entry.targetUser.id !== targetUserId));
      } else {
        setRematchLater((current) =>
          current.filter((entry) => entry.targetUser.id !== targetUserId),
        );
      }
    } catch (error) {
      console.error('Failed to remove saved player', error);
    }
  };

  const togglePreference = (value: 'male' | 'female') => {
    setEditData((current) => {
      const exists = current.matchPreferences.includes(value);
      const next = exists
        ? current.matchPreferences.filter((entry) => entry !== value)
        : [...current.matchPreferences, value];

      return {
        ...current,
        matchPreferences: next.length > 0 ? next : current.matchPreferences,
      };
    });
  };

  const locationLabel = [user?.city, user?.country].filter(Boolean).join(', ') || 'Global community';
  const totalGames = user?.gamesPlayed || 0;
  const winRate = totalGames > 0 ? Math.round(((user?.wins || 0) / totalGames) * 100) : 0;
  const connectionsByTab: Record<ConnectionsTab, SocialUser[]> = {
    followers,
    following,
    pending_followers: pendingFollowers,
    pending_following: pendingFollowing,
  };
  const activeConnections = connectionsByTab[activeConnectionsTab];
  const messageReadyCount = new Set(
    [...followers, ...following, ...pendingFollowers, ...pendingFollowing].map((entry) => entry.id),
  ).size;
  const trustHighlights = [
    {
      label: 'Profile completion',
      value: `${user?.profileCompletion || 0}%`,
      note: 'Based on photo, bio, location, age, interests, and preferences',
    },
    {
      label: 'Last active',
      value: formatLastActive(user?.lastActiveAt, user?.isOnline),
      note: 'Updated from your latest session or socket activity',
    },
    {
      label: 'Photo status',
      value: user?.isProfilePhotoVerified ? 'Verified' : 'Pending review',
      note: 'Changing your profile photo resets verification until reviewed',
    },
    {
      label: 'Match preference',
      value: describeMatchPreferences(user?.matchPreferences),
      note: 'Used by the new preference-based matchmaking flow',
    },
  ];

  const savedSections = useMemo(
    () => [
      { title: 'Favorites', items: favorites, kind: 'favorite' as const },
      { title: 'Rematch later', items: rematchLater, kind: 'rematch_later' as const },
    ],
    [favorites, rematchLater],
  );

  if (!user || loading) {
    return (
      <RomanticLayout>
        <div className="page-center">
          <div className="card text-center">
            <div className="font-bold text-2xl text-gray-800">Loading profile...</div>
            <div className="mt-2 text-gray-600 opacity-75">
              One moment while we fetch your love stats.
            </div>
          </div>
        </div>
      </RomanticLayout>
    );
  }

  return (
    <RomanticLayout>
      <div className="page-shell animate-fade-in">
        <section className="page-hero-card px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Profile
              </span>

              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-300/35 blur-3xl" />
                  <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/90 bg-gradient-to-br from-rose-100 via-white to-amber-50 shadow-[0_28px_60px_-32px_rgba(190,24,93,0.6)] md:h-36 md:w-36">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-black uppercase tracking-tight text-rose-400">
                        {user.username?.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                      <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                        {user.displayName || user.username}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <EloBadge rating={user.eloRating || 1200} />
                        {user.isProfilePhotoVerified && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                            Verified photo
                          </span>
                        )}
                        {user.isOnline && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                            Online
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>@{user.username}</span>
                      <span className="h-1 w-1 rounded-full bg-rose-200" />
                      <span>{user.gender}</span>
                      <span className="h-1 w-1 rounded-full bg-rose-200" />
                      <span>{locationLabel}</span>
                    </div>
                  </div>

                  <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                    {user.bio?.trim() ||
                      'Curate your story, tune your preferences, and keep your best connections close.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Matches
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{totalGames}</p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Win rate
                  </p>
                  <p className="mt-3 text-2xl font-black text-emerald-600">{winRate}%</p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Messages
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{messageReadyCount}</p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Favorites
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{favorites.length}</p>
                </div>
              </div>
            </div>

            <div className="page-dark-card rounded-[2.45rem] p-6 text-white">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-rose-300/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />

              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                    Profile controls
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Tune how you show up on the board.
                  </h2>
                </div>

                <div className="space-y-3">
                  {!isEditing ? (
                    <RomanticButton onClick={() => setIsEditing(true)} className="w-full">
                      Edit profile
                    </RomanticButton>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RomanticButton onClick={handleSave} className="w-full">
                        Save changes
                      </RomanticButton>
                      <button
                        type="button"
                        onClick={() => {
                          setEditData(buildEditData(user));
                          setIsEditing(false);
                        }}
                        className="w-full rounded-[1.35rem] border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => navigate('/friends')}
                      className="w-full rounded-[1.35rem] border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:border-rose-200/30 hover:bg-white/10"
                    >
                      Open inbox
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-[1.35rem] border border-rose-200/35 bg-rose-400/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {trustHighlights.map((item) => (
                    <div key={item.label} className="rounded-[1.45rem] border border-white/10 bg-white/6 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-black text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="page-glass-card rounded-[2.35rem] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                  Trust signals
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  Confidence builders
                </h2>
              </div>
              <span className="rounded-full border border-rose-100 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                Profile health
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {trustHighlights.map((item) => (
                <div key={item.label} className="rounded-[1.65rem] border border-rose-100 bg-white/88 p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="mt-8 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className={profileFieldClassName}
                    placeholder="Display name"
                    value={editData.displayName}
                    onChange={(event) =>
                      setEditData((current) => ({ ...current, displayName: event.target.value }))
                    }
                  />
                  <input
                    className={profileFieldClassName}
                    placeholder="Age"
                    value={editData.age}
                    onChange={(event) =>
                      setEditData((current) => ({ ...current, age: event.target.value }))
                    }
                  />
                  <input
                    className={profileFieldClassName}
                    placeholder="City"
                    value={editData.city}
                    onChange={(event) =>
                      setEditData((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                  <input
                    className={profileFieldClassName}
                    placeholder="Country"
                    value={editData.country}
                    onChange={(event) =>
                      setEditData((current) => ({ ...current, country: event.target.value }))
                    }
                  />
                  <input
                    className={profileFieldClassName}
                    placeholder="Profile photo URL"
                    value={editData.profilePhoto}
                    onChange={(event) =>
                      setEditData((current) => ({ ...current, profilePhoto: event.target.value }))
                    }
                  />
                  <input
                    className={profileFieldClassName}
                    placeholder="Preferred match distance (km)"
                    value={editData.preferredMatchDistance}
                    onChange={(event) =>
                      setEditData((current) => ({
                        ...current,
                        preferredMatchDistance: event.target.value,
                      }))
                    }
                  />
                </div>

                <textarea
                  className={`${profileFieldClassName} min-h-[140px] resize-y`}
                  placeholder="Bio"
                  value={editData.bio}
                  onChange={(event) =>
                    setEditData((current) => ({ ...current, bio: event.target.value }))
                  }
                />

                <input
                  className={profileFieldClassName}
                  placeholder="Interests, separated by commas"
                  value={editData.interests}
                  onChange={(event) =>
                    setEditData((current) => ({ ...current, interests: event.target.value }))
                  }
                />

                <div className="rounded-[1.65rem] border border-rose-100 bg-white/88 p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Match preferences
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(['male', 'female'] as const).map((value) => {
                      const active = editData.matchPreferences.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => togglePreference(value)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-rose-200 bg-rose-500 text-white'
                              : 'border-rose-100 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500'
                          }`}
                        >
                          {value === 'male' ? 'Men' : 'Women'}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={editData.learnMode}
                      onChange={(event) =>
                        setEditData((current) => ({
                          ...current,
                          learnMode: event.target.checked,
                        }))
                      }
                    />
                    Learn While Dating Mode
                  </label>
                </div>
              </div>
            )}
          </article>

          <div className="space-y-8">
            <article className="page-glass-card rounded-[2.35rem] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    Connections
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    Followers and messages
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/friends')}
                  className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-500 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
                >
                  Open inbox
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {connectionTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveConnectionsTab(tab.key)}
                    className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                      activeConnectionsTab === tab.key
                        ? 'border-rose-200 bg-rose-500 text-white'
                        : 'border-rose-100 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500'
                    }`}
                  >
                    {tab.label} ({connectionsByTab[tab.key].length})
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {activeConnections.length > 0 ? (
                  activeConnections.map((connection) => (
                    <div
                      key={`${activeConnectionsTab}-${connection.id}`}
                      className="rounded-[1.6rem] border border-rose-100/80 bg-white/88 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white bg-gradient-to-br from-rose-100 via-white to-amber-50 font-black uppercase text-rose-500 shadow-sm">
                            {connection.profilePhoto ? (
                              <img
                                src={connection.profilePhoto}
                                alt={connection.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              connection.username.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-slate-900">
                              {connection.displayName || connection.username}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              @{connection.username}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              Elo {connection.eloRating || 1200}
                              {connection.country ? ` - ${connection.country}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/friends?contact=${connection.id}`)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            Message
                          </button>
                          {activeConnectionsTab === 'pending_followers' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptFollower(connection.id)}
                              className="rounded-full border border-rose-500 bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                            >
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-rose-200 bg-white/72 p-5 text-sm leading-7 text-slate-500">
                    No players in this section yet.
                  </div>
                )}
              </div>
            </article>

            <article className="page-glass-card rounded-[2.35rem] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    Saved players
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    Favorites and rematch list
                  </h2>
                </div>
              </div>

              {savedSections.map((section) => (
                <div key={section.title} className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {section.title}
                    </p>
                    <span className="rounded-full border border-rose-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {section.items.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {section.items.length > 0 ? (
                      section.items.map((entry) => (
                        <div
                          key={`${section.kind}-${entry.targetUser.id}`}
                          className="rounded-[1.5rem] border border-rose-100/80 bg-white/88 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-base font-black text-slate-900">
                                {entry.targetUser.displayName || entry.targetUser.username}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                @{entry.targetUser.username}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/friends?contact=${entry.targetUser.id}`)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
                              >
                                Message
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSavedPlayer(entry.targetUser.id, section.kind)}
                                className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-white/72 p-4 text-sm leading-7 text-slate-500">
                        No players saved here yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </article>
          </div>
        </section>

        <article className="page-glass-card mt-10 rounded-[2.45rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 border-b border-rose-100/80 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Recent encounters
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Match history
              </h2>
            </div>
            <span className="rounded-full border border-rose-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              {recentGames.length} recent match{recentGames.length === 1 ? '' : 'es'}
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {recentGames.length > 0 ? (
              recentGames.map((game, index) => {
                const isWhite = String(game.whitePlayerId) === String(user.id);
                const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
                return (
                  <div
                    key={game.id || `${game.createdAt}-${index}`}
                    className="rounded-[2rem] border border-rose-100/80 bg-white/88 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.1rem] border border-white bg-white shadow-sm">
                          {opponent?.profilePhoto ? (
                            <img
                              src={opponent.profilePhoto}
                              alt="Opponent"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-black uppercase text-rose-400">
                              {opponent?.username?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Opponent
                          </p>
                          <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900">
                            {opponent?.displayName || opponent?.username || 'Mysterious guest'}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            {new Date(game.createdAt).toLocaleDateString()} - {game.result || 'Checkmate'}
                          </p>
                        </div>
                      </div>

                      {opponent?.id && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/friends?contact=${opponent.id}`)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/saved-players', {
                                  targetUserId: opponent.id,
                                  kind: 'rematch_later',
                                  sourceGameId: game.id,
                                });
                                const response = await api.get('/saved-players?kind=rematch_later');
                                setRematchLater(response.data);
                              } catch (error) {
                                console.error('Failed to save rematch later', error);
                              }
                            }}
                            className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition hover:border-sky-200 hover:bg-sky-50"
                          >
                            Rematch later
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="page-dashed-card rounded-[2.4rem] p-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                  No matches yet
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                  Your match history will show up here.
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-500">
                  Start a game to build your record, compare results, and keep the
                  profile feeling alive.
                </p>
                <RomanticButton onClick={() => navigate('/play')} className="mt-6">
                  Find first match
                </RomanticButton>
              </div>
            )}
          </div>
        </article>
      </div>
    </RomanticLayout>
  );
};

export default ProfilePage;
