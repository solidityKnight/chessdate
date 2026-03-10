import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';

export const useSocket = () => {
  const isInitialized = useRef(false);
  const isConnected = useGameStore((state) => state.isConnected);

  useEffect(() => {
    if (!isInitialized.current) {
      socketService.connect();
      isInitialized.current = true;
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  return {
    socket: socketService.getSocket(),
    isConnected,
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
  };
};