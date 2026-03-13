import React from 'react';

interface EloBadgeProps {
  rating: number;
  className?: string;
}

const EloBadge: React.FC<EloBadgeProps> = ({ rating, className = '' }) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200 ${className}`}>
      <span className="mr-1">🏆</span>
      Elo: {rating}
    </div>
  );
};

export default EloBadge;
