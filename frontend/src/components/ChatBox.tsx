import React, { useState, useRef } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { formatTimestamp } from '../utils/chessHelpers';

const ChatBox: React.FC = () => {
  const { chatMessages, sendMessage, currentGame } = useChessGame();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // REMOVED: automatic scroll to bottom to prevent page jumps
  /*
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);
  */

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
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-hidden border border-gray-700">
      <h3 className="text-base sm:text-lg font-semibold mb-2 text-center shrink-0">Chat</h3>

      <div className="chat-container flex-1 overflow-y-auto mb-3 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-600">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-xs sm:text-sm text-center italic mt-4">No messages yet. Say hello!</p>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className={getMessageClasses(msg.playerColor)}>
              <div className="text-[10px] text-gray-400 mb-0.5">
                {msg.playerColor === 'white' ? 'White' : 'Black'} • {formatTimestamp(msg.timestamp)}
              </div>
              <div className="text-xs sm:text-sm break-words">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type..."
          className="flex-1 min-w-0 px-2 py-1.5 bg-gray-700 text-white text-xs sm:text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim() || !currentGame}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;