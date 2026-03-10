import { useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';

export const useMatchmaking = () => {
  const { isInQueue, selectedGender, queueStats } = useGameStore();

  const selectGender = useCallback((gender: 'male' | 'female') => {
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