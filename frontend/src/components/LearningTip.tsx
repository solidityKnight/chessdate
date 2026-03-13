import React, { useState, useEffect } from 'react';

export interface TipData {
  type: string;
  message: string;
  explanation: string;
}

interface LearningTipProps {
  tip: TipData | null;
  onClose: () => void;
}

const LearningTip: React.FC<LearningTipProps> = ({ tip, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tip) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); // Wait for fade out
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [tip, onClose]);

  if (!tip) return null;

  return (
    <div className={`fixed bottom-24 right-8 z-50 transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-pink-100 p-5 max-w-xs overflow-hidden relative">
        {/* Decorative background heart */}
        <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 grayscale pointer-events-none">♟️</div>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-lg">
            ♟️
          </div>
          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Chess Tip</span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-1">{tip.message}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{tip.explanation}</p>
        
        <button 
          onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default LearningTip;
