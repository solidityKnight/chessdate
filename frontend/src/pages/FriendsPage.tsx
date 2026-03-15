import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/apiService';
import { useSocket } from '../hooks/useSocket';
import RomanticLayout from '../components/RomanticLayout';
import { useGameStore } from '../store/gameStore';
import type {
  FriendMessage,
  InboxSummary,
  SaveKind,
  SocialUser,
} from '../types/social';
import { formatConversationTime, formatLastActive } from '../utils/social';

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

const FriendsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inbox, setInbox] = useState<InboxSummary[]>([]);
  const [pendingFollowers, setPendingFollowers] = useState<SocialUser[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(
    searchParams.get('contact') || '',
  );
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { socket } = useSocket();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const setUnreadFriendMessages = useGameStore((state) => state.setUnreadFriendMessages);

  const fetchInboxData = useCallback(async () => {
    try {
      const [inboxRes, pendingFollowersRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/follow/list?type=pending_followers'),
      ]);

      setInbox(inboxRes.data);
      setPendingFollowers(pendingFollowersRes.data);
    } catch (error) {
      console.error('Failed to fetch inbox', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInboxData();
  }, [fetchInboxData]);

  useEffect(() => {
    const contactId = searchParams.get('contact') || '';
    if (contactId !== selectedContactId) {
      setSelectedContactId(contactId);
      setMessages([]);
    }
  }, [searchParams, selectedContactId]);

  useEffect(() => {
    if (!selectedContactId && inbox.length > 0) {
      const firstConversation = inbox.find((entry) => !entry.blockedByThem) || inbox[0];
      setSelectedContactId(firstConversation.user.id);
      setSearchParams({ contact: firstConversation.user.id });
    }
  }, [inbox, selectedContactId, setSearchParams]);

  const selectedConversation = useMemo(
    () => inbox.find((entry) => entry.user.id === selectedContactId) || null,
    [inbox, selectedContactId],
  );

  const totalUnread = useMemo(
    () => inbox.reduce((sum, entry) => sum + entry.unreadCount, 0),
    [inbox],
  );

  useEffect(() => {
    setUnreadFriendMessages(totalUnread);
  }, [setUnreadFriendMessages, totalUnread]);

  useEffect(() => {
    const friendId = selectedConversation?.user.id;
    if (!socket || !friendId) return;

    let cancelled = false;

    const openConversation = async () => {
      try {
        const response = await api.post('/messages/mark-read', {
          friendId,
        });

        if (!cancelled) {
          setUnreadFriendMessages(response.data.unreadCount || 0);
          socket.emit('join_friend_chat', { friendId });
          fetchInboxData();
        }
      } catch (error) {
        console.error('Failed to mark conversation as read', error);
        socket.emit('join_friend_chat', { friendId });
      }
    };

    openConversation();

    return () => {
      cancelled = true;
    };
  }, [fetchInboxData, selectedConversation?.user.id, setUnreadFriendMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleHistory = ({
      friendId,
      history,
    }: {
      friendId: string;
      history: FriendMessage[];
    }) => {
      if (selectedContactId === friendId) {
        setMessages(history);
      }
    };

    const handleNewMessage = (message: FriendMessage) => {
      if (
        selectedContactId &&
        (selectedContactId === message.senderId || selectedContactId === message.receiverId)
      ) {
        setMessages((current) =>
          current.some((entry) => entry.id === message.id)
            ? current
            : [...current, message],
        );
      }

      fetchInboxData();
    };

    const handleInboxUpdated = () => {
      fetchInboxData();
    };

    const handleSocketError = (error: { message?: string }) => {
      console.error('Socket error:', error);
    };

    socket.on('friend_chat_history', handleHistory);
    socket.on('new_friend_message', handleNewMessage);
    socket.on('friend_inbox_updated', handleInboxUpdated);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('friend_chat_history', handleHistory);
      socket.off('new_friend_message', handleNewMessage);
      socket.off('friend_inbox_updated', handleInboxUpdated);
      socket.off('error', handleSocketError);
    };
  }, [fetchInboxData, selectedContactId, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectContact = (contactId: string) => {
    if (selectedContactId === contactId) return;
    setSelectedContactId(contactId);
    setMessages([]);
    setNewMessage('');
    setSearchParams({ contact: contactId });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    socket.emit('send_friend_message', {
      friendId: selectedConversation.user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleAccept = async (followerId: string) => {
    setActionLoading(`accept-${followerId}`);
    try {
      await api.post('/follow/accept', { followerId });
      await fetchInboxData();
    } catch (error) {
      window.alert(parseApiErrorMessage(error, 'Could not accept this follow request.'));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSafetyAction = async (type: 'mute' | 'block') => {
    if (!selectedConversation) return;

    const active = type === 'mute' ? selectedConversation.muted : selectedConversation.blocked;

    if (type === 'block' && !active) {
      const confirmed = window.confirm(
        `Block ${selectedConversation.user.displayName || selectedConversation.user.username}?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setActionLoading(type);

    try {
      if (active) {
        await api.delete(`/safety/action/${type}/${selectedConversation.user.id}`);
      } else {
        await api.post('/safety/action', {
          targetUserId: selectedConversation.user.id,
          type,
        });
      }

      await fetchInboxData();
    } catch (error) {
      window.alert(parseApiErrorMessage(error, `Could not ${type} this player.`));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReport = async () => {
    if (!selectedConversation) return;
    const reason = window.prompt(
      `Tell us why you want to report ${
        selectedConversation.user.displayName || selectedConversation.user.username
      }.`,
    );
    if (!reason?.trim()) return;

    setActionLoading('report');

    try {
      await api.post('/safety/report', {
        targetUserId: selectedConversation.user.id,
        reason: reason.trim(),
      });
      window.alert('Report submitted. Thank you.');
    } catch (error) {
      window.alert(parseApiErrorMessage(error, 'Could not submit your report.'));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSavedKind = async (kind: SaveKind) => {
    if (!selectedConversation) return;
    const isSaved = selectedConversation.savedKinds.includes(kind);
    setActionLoading(kind);

    try {
      if (isSaved) {
        await api.delete('/saved-players', {
          data: {
            targetUserId: selectedConversation.user.id,
            kind,
          },
        });
      } else {
        await api.post('/saved-players', {
          targetUserId: selectedConversation.user.id,
          kind,
        });
      }

      await fetchInboxData();
    } catch (error) {
      window.alert(parseApiErrorMessage(error, 'Could not update saved players.'));
    } finally {
      setActionLoading(null);
    }
  };

  const selectedUser = selectedConversation?.user;
  const chatLocked =
    !selectedConversation ||
    selectedConversation.blocked ||
    selectedConversation.blockedByThem ||
    !selectedConversation.canMessage;

  return (
    <RomanticLayout>
      <div className="page-shell">
        <section className="page-hero-card px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Messages
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  Your inbox now feels alive, not hidden.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Follow-based chats now surface unread counts, last-message previews,
                  and safety controls in one place. Open a thread to mark it read and
                  keep the badge in sync everywhere.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Conversations
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{inbox.length}</p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Unread
                  </p>
                  <p className="mt-3 text-2xl font-black text-rose-500">{totalUnread}</p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Requests
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {pendingFollowers.length}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Muted
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {inbox.filter((entry) => entry.muted).length}
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
                    Safety controls
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Mute, block, and report are built into every thread.
                  </h2>
                </div>

                <div className="space-y-3">
                  {[
                    'Unread counts disappear as soon as you open the conversation.',
                    'Muted players stay connected but stop adding pressure to your badge count.',
                    'Blocking stops follow, chat, and future matchmaking from both sides.',
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="space-y-6">
            <article className="page-glass-card rounded-[2.1rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    Requests
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Anyone who follows you can already message you. Accept them here
                    to turn it into a fully mutual connection.
                  </p>
                </div>
                <span className="rounded-full border border-rose-100 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {pendingFollowers.length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  [...Array(2)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-[1.5rem] border border-rose-100/70 bg-white/85 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-rose-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 rounded-full bg-rose-100" />
                          <div className="h-3 w-20 rounded-full bg-rose-50" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : pendingFollowers.length > 0 ? (
                  pendingFollowers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-[1.5rem] border border-rose-100/70 bg-white/88 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => handleSelectContact(user.id)}
                          className="flex min-w-0 flex-1 items-center gap-4 text-left"
                        >
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-white bg-gradient-to-br from-rose-100 via-white to-amber-50 font-black uppercase text-rose-500 shadow-sm">
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                              {user.displayName || user.username}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              @{user.username}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAccept(user.id)}
                          disabled={actionLoading === `accept-${user.id}`}
                          className="rounded-full border border-rose-200 bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-white/70 p-4 text-sm leading-7 text-slate-500">
                    No pending follower requests right now.
                  </div>
                )}
              </div>
            </article>

            <article className="page-glass-card rounded-[2.2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    Inbox
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Sorted by the latest conversation. Muted threads stay visible but
                    stop pulling focus.
                  </p>
                </div>
                <span className="rounded-full border border-rose-100 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {inbox.length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  [...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-[1.5rem] border border-rose-100/70 bg-white/85 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-rose-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 rounded-full bg-rose-100" />
                          <div className="h-3 w-24 rounded-full bg-rose-50" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : inbox.length > 0 ? (
                  inbox.map((entry) => (
                    <button
                      key={entry.user.id}
                      type="button"
                      onClick={() => handleSelectContact(entry.user.id)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 ${
                        selectedConversation?.user.id === entry.user.id
                          ? 'border-rose-200 bg-rose-50/85 shadow-[0_18px_40px_-30px_rgba(190,24,93,0.35)]'
                          : 'border-rose-100/70 bg-white/88'
                      } ${entry.muted ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-white bg-gradient-to-br from-rose-100 via-white to-amber-50 font-black uppercase text-rose-500 shadow-sm">
                            {entry.user.profilePhoto ? (
                              <img
                                src={entry.user.profilePhoto}
                                alt={entry.user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              entry.user.username.charAt(0).toUpperCase()
                            )}
                            <span
                              className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white ${
                                entry.user.isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-black text-slate-900">
                                {entry.user.displayName || entry.user.username}
                              </p>
                              {entry.user.isProfilePhotoVerified && (
                                <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-sky-700">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              @{entry.user.username}
                            </p>
                            <p className="mt-2 truncate text-sm text-slate-500">
                              {entry.lastMessagePreview || 'No messages yet'}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatConversationTime(entry.lastMessageAt)}
                          </span>
                          <div className="flex flex-wrap justify-end gap-2">
                            {entry.unreadCount > 0 && (
                              <span className="rounded-full border border-rose-200 bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                                {entry.unreadCount} new
                              </span>
                            )}
                            {entry.muted && (
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                Muted
                              </span>
                            )}
                            {entry.savedKinds.includes('favorite') && (
                              <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                                Favorite
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-white/70 p-4 text-sm leading-7 text-slate-500">
                    No conversations yet. Follow someone or accept a request to get the
                    inbox moving.
                  </div>
                )}
              </div>
            </article>
          </div>

          <article className="page-glass-card flex min-h-[680px] flex-col overflow-hidden rounded-[2.45rem]">
            {selectedConversation && selectedUser ? (
              <>
                <div className="border-b border-rose-100/80 px-6 py-5 md:px-8">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white bg-gradient-to-br from-rose-100 via-white to-amber-50 font-black uppercase text-rose-500 shadow-sm">
                        {selectedUser.profilePhoto ? (
                          <img
                            src={selectedUser.profilePhoto}
                            alt={selectedUser.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          selectedUser.username.charAt(0).toUpperCase()
                        )}
                        <span
                          className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border border-white ${
                            selectedUser.isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                          Active conversation
                        </p>
                        <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900">
                          {selectedUser.displayName || selectedUser.username}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          @{selectedUser.username}
                          {selectedUser.country ? ` - ${selectedUser.country}` : ''}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {formatLastActive(
                            selectedUser.lastActiveAt,
                            selectedUser.isOnline,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSavedKind('favorite')}
                        disabled={actionLoading === 'favorite'}
                        className="rounded-full border border-amber-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-600 transition hover:border-amber-200 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {selectedConversation.savedKinds.includes('favorite')
                          ? 'Favorited'
                          : 'Favorite'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSavedKind('rematch_later')}
                        disabled={actionLoading === 'rematch_later'}
                        className="rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-600 transition hover:border-sky-200 hover:bg-sky-50 disabled:opacity-60"
                      >
                        {selectedConversation.savedKinds.includes('rematch_later')
                          ? 'Saved rematch'
                          : 'Rematch later'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSafetyAction('mute')}
                        disabled={actionLoading === 'mute' || selectedConversation.blocked}
                        className="rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
                      >
                        {selectedConversation.muted ? 'Unmute' : 'Mute'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSafetyAction('block')}
                        disabled={actionLoading === 'block'}
                        className="rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
                      >
                        {selectedConversation.blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReport}
                        disabled={actionLoading === 'report'}
                        className="rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-60"
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/70 to-rose-50/30 px-6 py-6 md:px-8">
                  {chatLocked && (
                    <div className="mb-4 rounded-[1.5rem] border border-rose-100 bg-white/90 p-4 text-sm leading-7 text-slate-500">
                      {selectedConversation.blocked
                        ? 'You blocked this player. Unblock them to continue chatting.'
                        : selectedConversation.blockedByThem
                          ? 'This player has blocked you, so the conversation is now locked.'
                          : 'Follow-based messaging is not currently available for this conversation.'}
                    </div>
                  )}

                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      messages.map((message) => {
                        const isMe = message.senderId !== selectedUser.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-[1.6rem] px-4 py-3 text-sm shadow-sm ${
                                isMe
                                  ? 'rounded-tr-md bg-rose-500 text-white'
                                  : 'rounded-tl-md border border-rose-100 bg-white text-slate-700'
                              }`}
                            >
                              <p className="leading-7">{message.content}</p>
                              <span
                                className={`mt-2 block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isMe ? 'text-rose-100/80' : 'text-slate-400'
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="page-dashed-card rounded-[2rem] p-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                          Conversation ready
                        </p>
                        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                          Say hello to {selectedUser.displayName || selectedUser.username}.
                        </h3>
                        <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-slate-500">
                          Your last message preview and unread state will start updating
                          as soon as the thread begins.
                        </p>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="border-t border-rose-100/80 bg-white/85 px-6 py-5 md:px-8">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 rounded-[1.4rem] border border-rose-100 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-200/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder={
                        chatLocked ? 'This conversation is currently unavailable.' : 'Write a message...'
                      }
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      disabled={chatLocked}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={chatLocked || !newMessage.trim()}
                      className="rounded-[1.4rem] bg-rose-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-24px_rgba(190,24,93,0.65)] transition hover:bg-rose-600 disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                  Inbox
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  Pick a conversation to open the live thread.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-8 text-slate-500">
                  The left side keeps previews, unread chips, and follower requests all
                  in one place.
                </p>
              </div>
            )}
          </article>
        </section>
      </div>
    </RomanticLayout>
  );
};

export default FriendsPage;
