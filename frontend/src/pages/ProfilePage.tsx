import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import EloBadge from '../components/EloBadge';

interface Game {
  whitePlayerId: number;
  blackPlayer: any;
  whitePlayer: any;
  winner: string;
  result: string;
  createdAt: string;
}

interface ConnectionUser {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
  eloRating?: number;
  country?: string;
}

interface EditProfileForm {
  displayName: string;
  age: string | number;
  bio: string;
  city: string;
  country: string;
  interests: string[];
  profilePhoto: string;
  learnMode: boolean;
}

const profileFieldClassName =
  'w-full rounded-[1.45rem] border border-rose-100 bg-white/82 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition duration-300 placeholder:text-slate-300 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-300/15';

const buildEditData = (source?: any): EditProfileForm => ({
  displayName: source?.displayName || '',
  age: source?.age || '',
  bio: source?.bio || '',
  city: source?.city || '',
  country: source?.country || '',
  interests: source?.interests || [],
  profilePhoto: source?.profilePhoto || '',
  learnMode: source?.learnMode ?? true,
});

const formatGameDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const connectionTabs = [
  {
    key: 'followers',
    label: 'Followers',
    emptyTitle: 'No followers yet',
    emptyDescription: 'Players who follow you will show up here.',
  },
  {
    key: 'following',
    label: 'Following',
    emptyTitle: 'Not following anyone yet',
    emptyDescription: 'Follow someone from Find Players to keep track of them here.',
  },
  {
    key: 'pending_followers',
    label: 'Requests',
    emptyTitle: 'No pending follower requests',
    emptyDescription: 'New follower requests will appear here.',
  },
  {
    key: 'pending_following',
    label: 'Outgoing',
    emptyTitle: 'No outgoing requests',
    emptyDescription: 'Pending players you followed will appear here.',
  },
] as const;

type ConnectionsTab = (typeof connectionTabs)[number]['key'];

const ProfilePage: React.FC = () => {
  const { user, setUser, setToken } = useGameStore();
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditProfileForm>(buildEditData());
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [pendingFollowers, setPendingFollowers] = useState<ConnectionUser[]>([]);
  const [pendingFollowing, setPendingFollowing] = useState<ConnectionUser[]>([]);
  const [activeConnectionsTab, setActiveConnectionsTab] =
    useState<ConnectionsTab>('followers');
  const hasFetched = useRef(false);
  const connectionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProfile = async () => {
      try {
        const [
          profileRes,
          followersRes,
          followingRes,
          pendingFollowersRes,
          pendingFollowingRes,
        ] = await Promise.all([
          api.get('/user/profile'),
          api.get('/follow/list?type=followers'),
          api.get('/follow/list?type=following'),
          api.get('/follow/list?type=pending_followers'),
          api.get('/follow/list?type=pending_following'),
        ]);

        setRecentGames(profileRes.data.recentGames);
        setEditData(buildEditData(profileRes.data.user));
        setUser(profileRes.data.user);
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
        setPendingFollowers(pendingFollowersRes.data);
        setPendingFollowing(pendingFollowingRes.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const handleCancelEdit = () => {
    setEditData(buildEditData(user));
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/user/profile', editData);
      setUser(response.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handleOpenConnections = (tab: ConnectionsTab) => {
    setActiveConnectionsTab(tab);
    window.requestAnimationFrame(() => {
      connectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleOpenMessages = (contactId?: string) => {
    navigate(contactId ? `/friends?contact=${contactId}` : '/friends');
  };

  const handleAcceptFollower = async (followerId: string) => {
    try {
      await api.post('/follow/accept', { followerId });
      setPendingFollowers((prev) => prev.filter((user) => user.id !== followerId));
      const acceptedUser = pendingFollowers.find((user) => user.id === followerId);
      if (acceptedUser) {
        setFollowers((prev) => [acceptedUser, ...prev]);
      }
      setActiveConnectionsTab('followers');
    } catch (err) {
      console.error('Failed to accept follow', err);
    }
  };

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

  const totalGames = user.gamesPlayed || 0;
  const winRate =
    totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
  const achievementCount = user.achievements?.length ?? 0;
  const locationLabel =
    [user.city, user.country].filter(Boolean).join(', ') || 'Global community';
  const storySummary =
    user.bio?.trim() ||
    'Curate your story, fine-tune your profile, and keep track of every match on the board.';
  const profileHighlights = [
    { label: 'Matches', value: totalGames, tone: 'text-slate-900' },
    { label: 'Win rate', value: `${winRate}%`, tone: 'text-emerald-600' },
    { label: 'Current streak', value: user.winStreak || 0, tone: 'text-rose-500' },
    { label: 'Achievements', value: achievementCount, tone: 'text-amber-600' },
  ];
  const connectionsByTab: Record<ConnectionsTab, ConnectionUser[]> = {
    followers,
    following,
    pending_followers: pendingFollowers,
    pending_following: pendingFollowing,
  };
  const activeConnections = connectionsByTab[activeConnectionsTab];
  const messageReadyCount = new Set(
    [...followers, ...following, ...pendingFollowers, ...pendingFollowing].map(
      (userItem) => userItem.id
    )
  ).size;
  const connectionTabMeta = {
    followers: { badge: 'Follows you', tone: 'text-amber-600' },
    following: { badge: 'You follow', tone: 'text-slate-600' },
    pending_followers: { badge: 'Requested', tone: 'text-rose-500' },
    pending_following: { badge: 'Pending', tone: 'text-sky-600' },
  } as const;

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
                  {(user as any).isOnline && (
                    <span className="absolute bottom-2 right-2 inline-flex h-6 w-6 rounded-full border-4 border-white bg-emerald-400 shadow-lg" />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                      <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                        {user.displayName || user.username}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <EloBadge rating={user.eloRating || 1200} />
                        {user.role === 'admin' && (
                          <span className="rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            Admin
                          </span>
                        )}
                        {(user as any).isOnline && (
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
                    {storySummary}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profileHighlights.map((item) => (
                  <div key={item.label} className="page-stat-card rounded-[1.75rem] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {item.label}
                    </p>
                    <p className={`mt-3 text-2xl font-black ${item.tone}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => handleOpenConnections('followers')}
                  className="page-stat-card rounded-[1.75rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-rose-200"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Followers
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {followers.length}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    See who can message you
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenConnections('following')}
                  className="page-stat-card rounded-[1.75rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-rose-200"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Following
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {following.length}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Open players you follow
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenConnections('pending_followers')}
                  className="page-stat-card rounded-[1.75rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-rose-200"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Requests
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {pendingFollowers.length}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Review new follower requests
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMessages()}
                  className="page-stat-card rounded-[1.75rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-rose-200"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Messages
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {messageReadyCount}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Jump straight to your inbox
                  </p>
                </button>
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Location
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {locationLabel}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Mode
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {user.learnMode ? 'Learning mode on' : 'Standard mode'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Best streak
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {user.maxWinStreak || 0} wins
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                      Achievements
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {achievementCount} unlocked
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {!isEditing ? (
                    <RomanticButton
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      Edit profile
                    </RomanticButton>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RomanticButton onClick={handleSave} className="w-full">
                        Save changes
                      </RomanticButton>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full rounded-[1.35rem] border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleOpenConnections('followers')}
                      className="w-full rounded-[1.35rem] border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:border-rose-200/30 hover:bg-white/10"
                    >
                      View followers
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMessages()}
                      className="w-full rounded-[1.35rem] border border-rose-200/35 bg-rose-400/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/18"
                    >
                      Open messages
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-[1.35rem] border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-200/30 hover:bg-rose-400/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <article className="page-glass-card rounded-[2.45rem] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    Profile details
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    Your story and settings
                  </h2>
                </div>
                <span className="rounded-full border border-rose-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                  {isEditing ? 'Editing' : 'Live'}
                </span>
              </div>
              {isEditing ? (
                <div className="mt-8 space-y-6 animate-slide-up">
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                      Display name
                    </label>
                    <input
                      type="text"
                      className={profileFieldClassName}
                      value={editData.displayName}
                      onChange={(e) =>
                        setEditData({ ...editData, displayName: e.target.value })
                      }
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                      Your bio
                    </label>
                    <textarea
                      className={`${profileFieldClassName} min-h-[160px] resize-none`}
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      rows={5}
                      placeholder="Tell the kingdom your story..."
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        Age
                      </label>
                      <input
                        type="number"
                        className={profileFieldClassName}
                        value={editData.age}
                        onChange={(e) =>
                          setEditData({ ...editData, age: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                        City
                      </label>
                      <input
                        type="text"
                        className={profileFieldClassName}
                        value={editData.city}
                        onChange={(e) =>
                          setEditData({ ...editData, city: e.target.value })
                        }
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                      Country
                    </label>
                    <input
                      type="text"
                      className={profileFieldClassName}
                      value={editData.country}
                      onChange={(e) =>
                        setEditData({ ...editData, country: e.target.value })
                      }
                      placeholder="Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                      Profile photo URL
                    </label>
                    <input
                      type="url"
                      className={profileFieldClassName}
                      value={editData.profilePhoto}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          profilePhoto: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-[1.45rem] border border-rose-100 bg-rose-50/60 px-5 py-4">
                    <input
                      type="checkbox"
                      id="learnMode"
                      className="h-5 w-5 cursor-pointer rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                      checked={editData.learnMode}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          learnMode: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="learnMode"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Learn while dating mode
                    </label>
                  </div>
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  <div className="rounded-[2rem] border border-rose-100/80 bg-white/75 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                      Story
                    </p>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      {user.bio || 'This strategic mind is still writing its story.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                      Interests
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(user.interests?.length ?? 0) > 0 ? (
                        user.interests!.map((interest: string) => (
                          <span
                            key={interest}
                            className="rounded-full border border-rose-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 shadow-sm"
                          >
                            #{interest}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-dashed border-rose-200 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          No interests selected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="page-stat-card rounded-[1.6rem] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Age
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        {user.age || 'Not shared'}
                      </p>
                    </div>
                    <div className="page-stat-card rounded-[1.6rem] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Gender
                      </p>
                      <p className="mt-2 text-lg font-black capitalize text-slate-900">
                        {user.gender}
                      </p>
                    </div>
                    <div className="page-stat-card rounded-[1.6rem] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Location
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        {locationLabel}
                      </p>
                    </div>
                    <div className="page-stat-card rounded-[1.6rem] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Match mode
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        {user.learnMode ? 'Learning mode' : 'Standard mode'}
                      </p>
                    </div>
                  </div>

                  <div
                    ref={connectionsRef}
                    className="rounded-[2rem] border border-rose-100/80 bg-gradient-to-br from-white via-rose-50/55 to-amber-50/70 p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                          Connections
                        </p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                          Followers, requests, and messages
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          Anyone who follows you can open a message thread. Pick
                          a player below to jump into the inbox.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenMessages()}
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
                              ? 'border-rose-200 bg-rose-500 text-white shadow-[0_18px_36px_-24px_rgba(190,24,93,0.6)]'
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

                              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                <span
                                  className={`rounded-full border border-rose-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${connectionTabMeta[activeConnectionsTab].tone}`}
                                >
                                  {connectionTabMeta[activeConnectionsTab].badge}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessages(connection.id)}
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
                        <div className="rounded-[1.6rem] border border-dashed border-rose-200 bg-white/72 p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                            {connectionTabs.find((tab) => tab.key === activeConnectionsTab)?.emptyTitle}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-500">
                            {
                              connectionTabs.find((tab) => tab.key === activeConnectionsTab)
                                ?.emptyDescription
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
            <article className="page-dark-card rounded-[2.3rem] p-6 text-white">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-rose-300/10 blur-3xl" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                      Battle records
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">
                      Performance split
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">
                    Season view
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Total battles
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {totalGames}
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Win rate
                    </p>
                    <p className="mt-2 text-3xl font-black text-emerald-300">
                      {winRate}%
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                      style={{
                        width: `${(user.wins / (totalGames || 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-300"
                      style={{
                        width: `${(user.draws / (totalGames || 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-red-300"
                      style={{
                        width: `${(user.losses / (totalGames || 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-emerald-300/15 bg-emerald-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                        Wins
                      </p>
                      <p className="mt-2 text-xl font-black text-white">
                        {user.wins || 0}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-sky-300/15 bg-sky-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">
                        Draws
                      </p>
                      <p className="mt-2 text-xl font-black text-white">
                        {user.draws || 0}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-rose-300/15 bg-rose-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">
                        Losses
                      </p>
                      <p className="mt-2 text-xl font-black text-white">
                        {user.losses || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className="page-glass-card rounded-[2.45rem] p-6 md:p-8">
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
                recentGames.map((game, idx) => {
                  const isWhite = String(game.whitePlayerId) === String(user.id);
                  const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
                  const outcome =
                    game.winner === (isWhite ? 'white' : 'black')
                      ? 'WIN'
                      : game.winner === 'draw'
                        ? 'DRAW'
                        : 'LOSS';
                  const tone =
                    outcome === 'WIN'
                      ? {
                          card: 'border-emerald-100 bg-emerald-50/55',
                          badge: 'border-emerald-200 bg-white text-emerald-700',
                          rail: 'bg-emerald-400',
                          value: 'text-emerald-600',
                        }
                      : outcome === 'DRAW'
                        ? {
                            card: 'border-sky-100 bg-sky-50/55',
                            badge: 'border-sky-200 bg-white text-sky-700',
                            rail: 'bg-sky-400',
                            value: 'text-sky-600',
                          }
                        : {
                            card: 'border-rose-100 bg-rose-50/55',
                            badge: 'border-rose-200 bg-white text-rose-700',
                            rail: 'bg-rose-400',
                            value: 'text-rose-600',
                          };

                  return (
                    <div
                      key={idx}
                      className={`relative overflow-hidden rounded-[2rem] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.card}`}
                    >
                      <div className={`absolute bottom-5 left-0 top-5 w-1 rounded-full ${tone.rail}`} />
                      <div className="pl-4">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.1rem] border border-white bg-white shadow-sm">
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
                              <span
                                className={`absolute -bottom-1 -right-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                                  isWhite
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-800 bg-slate-900 text-white'
                                }`}
                              >
                                {isWhite ? 'White' : 'Black'}
                              </span>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Opponent
                              </p>
                              <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900">
                                {opponent?.displayName ||
                                  opponent?.username ||
                                  'Mysterious guest'}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                <span>{formatGameDate(game.createdAt)}</span>
                                <span className="h-1 w-1 rounded-full bg-rose-200" />
                                <span>{game.result || 'Checkmate'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${tone.badge}`}>
                              {outcome}
                            </span>
                            <span className={`text-2xl font-black tracking-tight ${tone.value}`}>
                              {outcome}
                            </span>
                          </div>
                        </div>
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
                    Start a game to build your record, compare results, and keep
                    the profile feeling alive.
                  </p>
                  <RomanticButton onClick={() => navigate('/play')} className="mt-6">
                    Find first match
                  </RomanticButton>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </RomanticLayout>
  );
};

export default ProfilePage;
