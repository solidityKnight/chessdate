import React from 'react';
import EloBadge from './EloBadge';
import FollowButton from './FollowButton';

interface PlayerCardProps {
  user: {
    id: string;
    username: string;
    displayName?: string;
    eloRating: number;
    profilePhoto?: string;
    country?: string;
  };
  showFollow?: boolean;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ user, showFollow = true, className = '' }) => {
  return (
    <div className={`group bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-pink-100 p-5 flex items-center gap-5 hover:shadow-2xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-50/50 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="flex-shrink-0 relative">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md group-hover:rotate-3 transition-transform duration-300">
          {user.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt={user.username} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-500 font-black text-2xl uppercase">
              {user.username.charAt(0)}
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="flex-grow min-w-0 z-10">
        <h3 className="font-black text-gray-800 truncate group-hover:text-pink-600 transition-colors tracking-tight">
          {user.displayName || user.username}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <EloBadge rating={user.eloRating} className="text-[10px] px-2.5 py-1 shadow-sm border-white" />
          {user.country && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 flex items-center gap-1">
              <span className="grayscale opacity-50">📍</span> {user.country}
            </span>
          )}
        </div>
      </div>

      {showFollow && (
        <div className="flex-shrink-0 z-10">
          <FollowButton userId={user.id} />
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
