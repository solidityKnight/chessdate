import React, { useState, useEffect, useRef } from 'react';
import api from '../services/apiService';
import { useSocket } from '../hooks/useSocket';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import PlayerCard from '../components/PlayerCard';

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFollows();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('friend_chat_history', ({ friendId, history }) => {
        if (selectedFriend?.id === friendId) {
          setMessages(history);
        }
      });

      socket.on('new_friend_message', (message) => {
        if (selectedFriend?.id === message.senderId || selectedFriend?.id === message.receiverId) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      return () => {
        socket.off('friend_chat_history');
        socket.off('new_friend_message');
        socket.off('error');
      };
    }
  }, [socket, selectedFriend]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFollows = async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        api.get('/follow/list?type=following'),
        api.get('/follow/list?type=pending_followers')
      ]);
      setFriends(friendsRes.data);
      setPending(pendingRes.data);
    } catch (err) {
      console.error('Failed to fetch follows', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followerId: string) => {
    try {
      await api.post('/follow/accept', { followerId });
      fetchFollows();
    } catch (err) {
      console.error('Failed to accept follow', err);
    }
  };

  const handleSelectFriend = (friend: any) => {
    if (selectedFriend?.id === friend.id) return;
    setSelectedFriend(friend);
    setMessages([]);
    setNewMessage('');
    if (socket) {
      socket.emit('join_friend_chat', { friendId: friend.id });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedFriend || !socket) return;
    socket.emit('send_friend_message', {
      friendId: selectedFriend.id,
      content: newMessage.trim()
    });
    setNewMessage('');
  };

  return (
    <RomanticLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-100px)]">
        <div className="flex flex-col md:flex-row h-full gap-6">
          
          {/* Sidebar: Friends & Requests */}
          <div className="w-full md:w-80 flex flex-col gap-6 overflow-y-auto pr-2">
            
            {/* Friend Requests */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-pink-500 uppercase tracking-wider">Requests ({pending.length})</h3>
                {pending.map(user => (
                  <div key={user.id} className="bg-pink-50 p-3 rounded-2xl border border-pink-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold text-xs uppercase">
                        {user.username[0]}
                      </div>
                      <span className="text-xs font-bold text-gray-700 truncate w-20">{user.username}</span>
                    </div>
                    <button 
                      onClick={() => handleAccept(user.id)}
                      className="px-3 py-1 bg-pink-500 text-white text-[10px] font-bold rounded-lg hover:bg-pink-600 shadow-sm"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div className="flex-grow space-y-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Friends ({friends.length})</h3>
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => handleSelectFriend(friend)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 shadow-sm ${
                      selectedFriend?.id === friend.id 
                        ? 'bg-pink-500 border-pink-600 text-white scale-[1.02]' 
                        : 'bg-white border-pink-50 hover:border-pink-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border-2 border-pink-200 uppercase flex-shrink-0">
                      {friend.username[0]}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold truncate ${selectedFriend?.id === friend.id ? 'text-white' : 'text-gray-800'}`}>
                        {friend.displayName || friend.username}
                      </div>
                      <div className={`text-[10px] truncate ${selectedFriend?.id === friend.id ? 'text-pink-100' : 'text-gray-400'}`}>
                        Elo: {friend.eloRating}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4">No friends yet. Go to Search to find players! 🔎</p>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-grow bg-white rounded-3xl border border-pink-100 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-pink-50 bg-pink-50/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border border-pink-200 uppercase">
                    {selectedFriend.username[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{selectedFriend.displayName || selectedFriend.username}</h4>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">● Online</span>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId !== selectedFriend.id;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe 
                            ? 'bg-pink-500 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-pink-50 rounded-tl-none'
                        }`}>
                          <p>{msg.content}</p>
                          <span className={`text-[10px] mt-1 block opacity-60 text-right`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="p-4 bg-white border-t border-pink-50">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-grow p-3 rounded-2xl border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      placeholder="Write a sweet message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95"
                    >
                      ✈️
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="text-6xl animate-bounce">💌</div>
                <h3 className="text-xl font-bold text-gray-800">Your Inbox</h3>
                <p className="text-gray-400 max-w-xs">Select a friend from the left to start a romantic chess conversation.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </RomanticLayout>
  );
};

export default FriendsPage;
