import { useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import type { MatchSelection } from '../types/social';

export const useMatchmaking = () => {
  const { isInQueue, selectedGender, queueStats } = useGameStore();

  const selectGender = useCallback((gender: MatchSelection) => {
    socketService.selectGender(gender);
  }, []);

  const cancelMatchmaking = useCallback(() => {
    socketService.cancelMatchmaking();
  }, []);

  return {
    isInQueue,
    selectedGender,
    queueStats,
    selectGender,
    cancelMatchmaking,
  };
};
