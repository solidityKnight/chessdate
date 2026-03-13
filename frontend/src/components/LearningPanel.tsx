import React from 'react';
import { TipData } from './LearningTip';

interface LearningPanelProps {
  tips: TipData[];
  isOpen: boolean;
  onClose: () => void;
}

const LearningPanel: React.FC<LearningPanelProps> = ({ tips, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-pink-100 z-[60] flex flex-col transition-transform duration-300 transform translate-x-0">
      <div className="p-6 border-b border-pink-50 flex items-center justify-between bg-pink-50/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <h2 className="text-xl font-bold text-gray-800">Learn Log</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors shadow-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {tips.length > 0 ? (
          tips.map((tip, i) => (
            <div key={i} className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100/50 hover:border-pink-200 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Tactic: {tip.type}</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">{tip.message}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{tip.explanation}</p>
            </div>
          )).reverse() // Newest first
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 grayscale">
            <span className="text-6xl mb-4">♟️</span>
            <p className="text-sm font-medium text-gray-500 italic">Make some strategic moves to see tips here!</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-pink-50 bg-gray-50">
        <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest">
          Powered by ChessDate Learn
        </p>
      </div>
    </div>
  );
};

export default LearningPanel;
