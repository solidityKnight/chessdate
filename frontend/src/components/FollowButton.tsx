import React, { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../services/apiService';

interface FollowButtonProps {
  userId: string;
  initialStatus?: 'none' | 'pending' | 'accepted';
  onStatusChange?: (status: 'none' | 'pending' | 'accepted') => void;
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  initialStatus = 'none', 
  onStatusChange,
  className = '' 
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (status !== 'none') return;
    setLoading(true);
    try {
      await axios.post('/api/follow/request', { followingId: userId }, { headers: getAuthHeaders() });
      setStatus('pending');
      onStatusChange?.('pending');
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'accepted') {
    return (
      <button 
        disabled 
        className={`px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200 cursor-default ${className}`}
      >
        ✓ Friends
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button 
        disabled 
        className={`px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium border border-gray-200 cursor-default ${className}`}
      >
        Pending...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? 'Sending...' : '+ Follow'}
    </button>
  );
};

export default FollowButton;
