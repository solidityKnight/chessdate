import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, X } from 'lucide-react';
import { socketService } from '../services/socketService';

const AchievementPopup: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    const handleAchievement = (data: { achievements: any[] }) => {
      setQueue(prev => [...prev, ...data.achievements]);
    };

    socketService.on('achievement_unlocked', handleAchievement);
    return () => socketService.off('achievement_unlocked', handleAchievement);
  }, []);

  const removeFirst = () => {
    setQueue(prev => prev.slice(1));
  };

  useEffect(() => {
    if (queue.length > 0) {
      const timer = setTimeout(removeFirst, 5000);
      return () => clearTimeout(timer);
    }
  }, [queue]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxWidth: 360,
      }}
    >
      <AnimatePresence>
        {queue.slice(0, 3).map((achievement, i) => (
          <motion.div
            key={achievement.name + i}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, x: 20 }}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(255, 250, 250, 0.88)',
              backdropFilter: 'blur(16px)',
              borderRadius: 28,
              padding: 16,
              boxShadow: '0 20px 40px -8px rgba(86, 48, 56, 0.3)',
              border: '1px solid #ffe8ec',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: 18,
                background: '#ffeef2',
                border: '1px solid #ffdae2',
                color: '#c9455c',
                boxShadow: 'inset 0 1px 3px #fff, 0 4px 8px rgba(255, 160, 180, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy className="w-8 h-8" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star className="w-3 h-3 fill-current" style={{ color: '#ff8ca2' }} />
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9455c' }}>
                  Achievement Unlocked
                </p>
              </div>
              <h4 style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.15, color: '#2a1f21', marginTop: 4 }}>
                {achievement.name}
              </h4>
              <p style={{ fontSize: 12, opacity: 0.75, color: '#3f2e31', marginTop: 4 }}>{achievement.description}</p>
            </div>
            <button
              onClick={removeFirst}
              style={{
                pointerEvents: 'auto',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                opacity: 0.6,
                padding: 6,
              }}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" style={{ color: '#3f2e31' }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementPopup;
