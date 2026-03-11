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
    <div className="fixed top-4 right-4 z-[100] space-y-4 pointer-events-none">
      <AnimatePresence>
        {queue.slice(0, 3).map((achievement, i) => (
          <motion.div
            key={achievement.name + i}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, x: 20 }}
            className="pointer-events-auto bg-gray-800 border-2 border-yellow-500 rounded-2xl shadow-2xl p-4 flex items-center space-x-4 max-w-sm overflow-hidden"
          >
            <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-500">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Achievement Unlocked</p>
              </div>
              <h4 className="text-white font-bold text-lg leading-tight">{achievement.name}</h4>
              <p className="text-gray-400 text-xs">{achievement.description}</p>
            </div>
            <button onClick={removeFirst} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementPopup;
