import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface PlayerTimerProps {
  color: 'white' | 'black';
  active: boolean; // is it this player's turn?
}

const formatTime = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const PlayerTimer: React.FC<PlayerTimerProps> = ({ color, active }) => {
  const currentGame = useGameStore((state) => state.currentGame);
  const timeRemaining = color === 'white' ? currentGame?.whiteTime : currentGame?.blackTime;
  const lastMoveAt = currentGame?.lastMoveAt;
  
  const [displayMs, setDisplayMs] = useState(timeRemaining || 600000);

  useEffect(() => {
    setDisplayMs(timeRemaining || 600000);
  }, [timeRemaining]);

  useEffect(() => {
    if (!active || !currentGame || currentGame.status !== 'active') return;
    
    // Update every 100ms
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (lastMoveAt || now);
      setDisplayMs(Math.max(0, (timeRemaining || 600000) - elapsed));
    }, 100);

    return () => clearInterval(intervalId);
  }, [active, timeRemaining, lastMoveAt, currentGame]);

  const isLowTime = displayMs < 60000; // less than 1 min

  return (
    <div className={`player-timer ${active ? 'active' : ''} ${isLowTime ? 'low-time' : ''}`} style={{
      padding: '8px 16px',
      background: active ? '#ff4b8b' : '#3f2e31',
      color: '#fff',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '1.2rem',
      boxShadow: active ? '0 0 10px rgba(255, 75, 139, 0.5)' : 'none',
      display: 'inline-block',
      width: '100px',
      textAlign: 'center',
      margin: '8px 0',
      transition: 'all 0.3s ease'
    }}>
      {formatTime(displayMs)}
    </div>
  );
};
