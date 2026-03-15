import React, { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../services/apiService';

interface FollowButtonProps {
  userId: string;
  initialStatus?: 'none' | 'pending' | 'accepted';
  onStatusChange?: (status: 'none' | 'pending' | 'accepted') => void;
  className?: string;
}

const baseClassName =
  'inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed';

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialStatus = 'none',
  onStatusChange,
  className = '',
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (status !== 'none') return;
    setLoading(true);
    try {
      await axios.post(
        '/api/follow/request',
        { followingId: userId },
        { headers: getAuthHeaders() }
      );
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
        className={`${baseClassName} border-emerald-200 bg-emerald-50 text-emerald-700 ${className}`}
      >
        Friends
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        disabled
        className={`${baseClassName} border-slate-200 bg-slate-100 text-slate-500 ${className}`}
      >
        Request sent
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`${baseClassName} border-rose-500 bg-rose-500 text-white shadow-[0_16px_36px_-18px_rgba(225,29,72,0.8)] hover:-translate-y-0.5 hover:bg-rose-600 disabled:opacity-60 ${className}`}
    >
      {loading ? 'Sending...' : 'Follow player'}
    </button>
  );
};

export default FollowButton;
