import React from 'react';

interface EloBadgeProps {
  rating: number;
  className?: string;
}

const EloBadge: React.FC<EloBadgeProps> = ({ rating, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 shadow-sm ${className}`}
    >
      <span className="rounded-full bg-white px-2 py-0.5 text-[9px] tracking-[0.2em] text-rose-500">
        Elo
      </span>
      <span className="text-xs font-bold tracking-normal text-slate-700">
        {rating}
      </span>
    </div>
  );
};

export default EloBadge;
