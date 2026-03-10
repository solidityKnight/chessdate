import React, { useState, useRef, useEffect } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { formatTimestamp } from '../utils/chessHelpers';

const ChatBox: React.FC = () => {
  const { chatMessages, sendMessage, currentGame } = useChessGame();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentGame) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const getMessageClasses = (playerColor: 'white' | 'black') => {
    const isOwnMessage = currentGame?.playerColor === playerColor;
    return `chat-message ${isOwnMessage ? 'own' : 'opponent'}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-96 sm:h-auto lg:h-96 flex flex-col">
      <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">Chat</h3>

      <div className="chat-container flex-1 overflow-y-auto mb-3 space-y-2 min-h-0">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-xs sm:text-sm text-center italic">No messages yet. Say hello to your opponent!</p>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className={getMessageClasses(msg.playerColor)}>
              <div className="text-xs text-gray-300 mb-1">
                {msg.playerColor === 'white' ? 'White' : 'Black'} • {formatTimestamp(msg.timestamp)}
              </div>
              <div className="text-xs sm:text-sm">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-2 sm:px-3 py-2 bg-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim() || !currentGame}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;