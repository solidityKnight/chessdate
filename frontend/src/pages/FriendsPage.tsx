import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/apiService';
import { useSocket } from '../hooks/useSocket';
import RomanticLayout from '../components/RomanticLayout';

interface ConnectionUser {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
  eloRating?: number;
  country?: string;
}

interface FriendMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const FriendsPage: React.FC = () => {
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [pendingFollowers, setPendingFollowers] = useState<ConnectionUser[]>([]);
  const [pendingFollowing, setPendingFollowing] = useState<ConnectionUser[]>([]);
  const [selectedContact, setSelectedContact] = useState<ConnectionUser | null>(null);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const allContacts = useMemo(() => {
    const seen = new Map<string, ConnectionUser>();
    [...pendingFollowers, ...followers, ...following, ...pendingFollowing].forEach((user) => {
      if (!seen.has(user.id)) {
        seen.set(user.id, user);
      }
    });
    return Array.from(seen.values());
  }, [followers, following, pendingFollowers, pendingFollowing]);

  const selectedContactId = selectedContact?.id || '';

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    const contactId = searchParams.get('contact');
    if (!contactId || allContacts.length === 0) return;

    const match = allContacts.find((user) => user.id === contactId);
    if (match && selectedContact?.id !== match.id) {
      setSelectedContact(match);
      setMessages([]);
      setNewMessage('');
    }
  }, [allContacts, searchParams, selectedContact?.id]);

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
        (selectedContactId === message.senderId ||
          selectedContactId === message.receiverId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleSocketError = (err: { message?: string }) => {
      console.error('Socket error:', err);
    };

    socket.on('friend_chat_history', handleHistory);
    socket.on('new_friend_message', handleNewMessage);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('friend_chat_history', handleHistory);
      socket.off('new_friend_message', handleNewMessage);
      socket.off('error', handleSocketError);
    };
  }, [socket, selectedContactId]);

  useEffect(() => {
    if (socket && selectedContact) {
      socket.emit('join_friend_chat', { friendId: selectedContact.id });
    }
  }, [socket, selectedContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const [
        followersRes,
        followingRes,
        pendingFollowersRes,
        pendingFollowingRes,
      ] = await Promise.all([
        api.get('/follow/list?type=followers'),
        api.get('/follow/list?type=following'),
        api.get('/follow/list?type=pending_followers'),
        api.get('/follow/list?type=pending_following'),
      ]);

      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
      setPendingFollowers(pendingFollowersRes.data);
      setPendingFollowing(pendingFollowingRes.data);
    } catch (err) {
      console.error('Failed to fetch follows', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followerId: string) => {
    try {
      await api.post('/follow/accept', { followerId });
      await fetchConnections();
    } catch (err) {
      console.error('Failed to accept follow', err);
    }
  };

  const handleSelectContact = (contact: ConnectionUser) => {
    if (selectedContact?.id === contact.id) return;
    setSelectedContact(contact);
    setMessages([]);
    setNewMessage('');
    setSearchParams({ contact: contact.id });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact || !socket) return;

    socket.emit('send_friend_message', {
      friendId: selectedContact.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const sections = [
    {
      key: 'pending_followers',
      title: 'Follower requests',
      subtitle: 'They can already message you after following.',
      users: pendingFollowers,
      accent: 'text-rose-500',
      badge: 'Requested',
      action: (user: ConnectionUser) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAccept(user.id);
          }}
          className="rounded-full border border-rose-200 bg-rose-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-rose-600"
        >
          Accept
        </button>
      ),
    },
    {
      key: 'followers',
      title: 'Followers',
      subtitle: 'People who follow you and can message you.',
      users: followers,
      accent: 'text-amber-600',
      badge: 'Follows you',
      action: null,
    },
    {
      key: 'following',
      title: 'Following',
      subtitle: 'Players you follow and can message.',
      users: following,
      accent: 'text-slate-600',
      badge: 'You follow',
      action: null,
    },
    {
      key: 'pending_following',
      title: 'Awaiting reply',
      subtitle: 'Your outgoing follow requests.',
      users: pendingFollowing,
      accent: 'text-sky-600',
      badge: 'Pending',
      action: null,
    },
  ];

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
                  Your inbox for followers, replies, and new connections.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Anyone connected through a follow can start a conversation
                  here. Pick a follower, a player you follow, or an open request
                  to keep things moving.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Followers
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {followers.length}
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Following
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {following.length}
                  </p>
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
                    Reachable chats
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {allContacts.length}
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
                    Messaging rules
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Following unlocks the conversation.
                  </h2>
                </div>

                <div className="space-y-3">
                  {[
                    'Follower requests can open a conversation right away.',
                    'Accepted followers stay in your inbox for future chats.',
                    'Selecting a player loads your latest private message history.',
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

        <section className="mt-10 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            {sections.map((section) => (
              <article key={section.key} className="page-glass-card rounded-[2.2rem] p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${section.accent}`}>
                      {section.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {section.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full border border-rose-100 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {section.users.length}
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
                  ) : section.users.length > 0 ? (
                    section.users.map((user) => (
                      <button
                        key={`${section.key}-${user.id}`}
                        type="button"
                        onClick={() => handleSelectContact(user)}
                        className={`w-full rounded-[1.5rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 ${
                          selectedContact?.id === user.id
                            ? 'border-rose-200 bg-rose-50/85 shadow-[0_18px_40px_-30px_rgba(190,24,93,0.35)]'
                            : 'border-rose-100/70 bg-white/88'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
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
                              <p className="mt-2 text-xs font-medium text-slate-500">
                                Elo {user.eloRating || 1200}
                                {user.country ? ` - ${user.country}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="rounded-full border border-rose-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
                              {section.badge}
                            </span>
                            {section.action ? section.action(user) : null}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-white/70 p-4 text-sm leading-7 text-slate-500">
                      No players in this section yet.
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <article className="page-glass-card flex min-h-[620px] flex-col overflow-hidden rounded-[2.45rem]">
            {selectedContact ? (
              <>
                <div className="border-b border-rose-100/80 px-6 py-5 md:px-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white bg-gradient-to-br from-rose-100 via-white to-amber-50 font-black uppercase text-rose-500 shadow-sm">
                        {selectedContact.profilePhoto ? (
                          <img
                            src={selectedContact.profilePhoto}
                            alt={selectedContact.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          selectedContact.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                          Active conversation
                        </p>
                        <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900">
                          {selectedContact.displayName || selectedContact.username}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          @{selectedContact.username}
                          {selectedContact.country ? ` - ${selectedContact.country}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-rose-100 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                      Private messages
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/70 to-rose-50/30 px-6 py-6 md:px-8">
                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isMe = msg.senderId !== selectedContact.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-[1.6rem] px-4 py-3 text-sm shadow-sm ${
                                isMe
                                  ? 'rounded-tr-md bg-rose-500 text-white'
                                  : 'rounded-tl-md border border-rose-100 bg-white text-slate-700'
                              }`}
                            >
                              <p className="leading-7">{msg.content}</p>
                              <span
                                className={`mt-2 block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isMe ? 'text-rose-100/80' : 'text-slate-400'
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString([], {
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
                          Say hello to {selectedContact.displayName || selectedContact.username}.
                        </h3>
                        <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-slate-500">
                          Messages will appear here as soon as the conversation
                          starts.
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
                      className="flex-1 rounded-[1.4rem] border border-rose-100 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-200/40"
                      placeholder="Write a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="rounded-[1.4rem] bg-rose-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-24px_rgba(190,24,93,0.65)] transition hover:bg-rose-600"
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
                  Pick a follower or connection to start messaging.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-8 text-slate-500">
                  Followers, accepted connections, and outgoing follow requests
                  all appear on the left. Select one to open the private chat.
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
