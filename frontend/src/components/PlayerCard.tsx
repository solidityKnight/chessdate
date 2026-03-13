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
    <div className={`bg-white rounded-xl shadow-sm border border-pink-100 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex-shrink-0">
        {user.profilePhoto ? (
          <img 
            src={user.profilePhoto} 
            alt={user.username} 
            className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border-2 border-pink-200 uppercase">
            {user.username.charAt(0)}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {user.displayName || user.username}
        </h3>
        <div className="flex items-center space-x-2 mt-1">
          <EloBadge rating={user.eloRating} />
          {user.country && (
            <span className="text-xs text-gray-500 truncate">📍 {user.country}</span>
          )}
        </div>
      </div>

      {showFollow && (
        <div className="flex-shrink-0">
          <FollowButton userId={user.id} />
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
