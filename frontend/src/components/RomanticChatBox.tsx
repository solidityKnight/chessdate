import React, { useEffect, useMemo, useState } from 'react';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socketService';
import { formatTimestamp } from '../utils/chessHelpers';

type RomanticChatBoxProps = {
  title?: string;
  showInput?: boolean;
};

const RomanticChatBox: React.FC<RomanticChatBoxProps> = ({ title = 'Match chat', showInput = true }) => {
  const { sendMessage } = useChessGame();
  const chatMessages = useGameStore((s) => s.chatMessages);
  const currentGame = useGameStore((s) => s.currentGame);
  const user = useGameStore((s) => s.user);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!currentGame?.gameId) return;
    socketService.getChatHistory();
  }, [currentGame?.gameId]);

  const displayedMessages = useMemo(() => {
    if (chatMessages.length > 0) return chatMessages.slice(-6);
    return [
      { playerColor: 'white', message: 'Hi! Ready to lose? ♟️❤️', timestamp: Date.now() - 120000 },
      { playerColor: 'black', message: "Haha we'll see 😏", timestamp: Date.now() - 60000 },
      { playerColor: 'white', message: 'Nice opening!', timestamp: Date.now() },
    ] as any[];
  }, [chatMessages]);

  return (
    <div className="chat-box">
      <h3>{title}</h3>

      {displayedMessages.map((m: any, idx: number) => (
        <div key={idx} className="message">
          <span>
            {currentGame && m.playerColor === currentGame.playerColor
              ? 'you:'
              : 'opponent:'}
          </span>{' '}
          {m.message}
          <div className="timestamp">{typeof m.timestamp === 'number' ? formatTimestamp(m.timestamp) : 'now'}</div>
        </div>
      ))}

      {showInput && (
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (!currentGame) return;
            if (!user) return;
            const trimmed = message.trim();
            if (!trimmed) return;
            sendMessage(trimmed);
            setMessage('');
          }}
        >
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." maxLength={500} />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
};

export default RomanticChatBox;
