import React, { useState } from 'react';
import api from '../services/apiService';

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

  const updateStatus = (nextStatus: 'none' | 'pending' | 'accepted') => {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  };

  const handleFollow = async () => {
    if (status !== 'none') return;
    setLoading(true);
    try {
      await api.post('/follow/request', { followingId: userId });
      updateStatus('pending');
    } catch (error: unknown) {
      console.error('Follow error:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data
      ) {
        window.alert(String(error.response.data.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'accepted') {
    return (
      <button
        type="button"
        disabled
        className={`${baseClassName} border-emerald-200 bg-emerald-50 text-emerald-700 ${className}`}
      >
        Connected
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        type="button"
        disabled
        className={`${baseClassName} border-slate-200 bg-slate-100 text-slate-500 ${className}`}
      >
        Request sent
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      className={`${baseClassName} border-rose-500 bg-rose-500 text-white shadow-[0_16px_36px_-18px_rgba(225,29,72,0.8)] hover:-translate-y-0.5 hover:bg-rose-600 disabled:opacity-60 ${className}`}
    >
      {loading ? 'Sending...' : 'Follow player'}
    </button>
  );
};

export default FollowButton;
