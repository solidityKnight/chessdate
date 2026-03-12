import { useCallback, useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';

/**
 * useChessGame
 *
 * Encapsulates all client-side chess interaction logic:
 * square selection, move dispatch, possible-move highlighting,
 * resignation, new-game requests, and chat.
 */
export const useChessGame = () => {
  /*
   * BUG FIX (pieces not moving + board not rotating):
   * The original used a single selector returning an object literal:
   *
   *   useGameStore((s) => ({ currentGame: s.currentGame, playerColor: s.currentGame?.playerColor }))
   *
   * Zustand compares selector return values with Object.is().  An object
   * literal always produces a NEW reference on every store change, so the
   * selector is always considered "changed", causing the component to
   * re-render on EVERY store update — including the ones triggered by
   * setSelectedSquare itself.  This reset selectedSquare back to null
   * immediately after it was set, making all clicks appear to do nothing.
   *
   * FIX: use one useGameStore call per primitive / stable value so Zustand
   * can do a simple Object.is comparison and only re-render when that
   * specific value actually changes.
   */
  const currentGame  = useGameStore((s) => s.currentGame);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const playerColor  = useGameStore((s) => s.currentGame?.playerColor ?? null);
  const rematchStatus = useGameStore((s) => s.rematchStatus);
  const setRematchStatus = useGameStore((s) => s.setRematchStatus);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves,  setPossibleMoves]  = useState<string[]>([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);

  // ─── Clear selection when the game changes ────────────────────────────────
  useEffect(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [currentGame?.gameId]);

  // ─── Possible-move responses from the server ──────────────────────────────
  /*
   * BUG FIX: keep a ref to the currently requested square so that if the
   * effect re-runs before the server responds (e.g. rapid clicks), stale
   * responses from the previous square are ignored even if the closure has
   * already been GC'd.
   */
  const requestedSquareRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedSquare || !currentGame?.gameId) {
      setPossibleMoves([]);
      return;
    }

    setIsLoadingMoves(true);
    requestedSquareRef.current = selectedSquare;
    socketService.getPossibleMoves(currentGame.gameId, selectedSquare);

    const handlePossibleMoves = (data: { square: string; moves: { to: string }[] }) => {
      // Discard responses that no longer match the active selection.
      if (data.square !== requestedSquareRef.current) return;
      setPossibleMoves(data.moves.map((m) => m.to));
      setIsLoadingMoves(false);
    };

    socketService.on('possible_moves', handlePossibleMoves);
    return () => {
      socketService.off('possible_moves', handlePossibleMoves);
      setIsLoadingMoves(false);
    };
  }, [selectedSquare, currentGame?.gameId]);

  // ─── Rematch listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const handleRematchRequested = () => setRematchStatus('received');
    const handleRematchDeclined = () => setRematchStatus('declined');

    socketService.on('rematch_requested', handleRematchRequested);
    socketService.on('rematch_declined', handleRematchDeclined);

    return () => {
      socketService.off('rematch_requested', handleRematchRequested);
      socketService.off('rematch_declined', handleRematchDeclined);
    };
  }, [setRematchStatus]);

  // ─── makeMove ─────────────────────────────────────────────────────────────
  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (!currentGame || currentGame.status !== 'active') return;
      socketService.makeMove(from, to, promotion);
      setSelectedSquare(null);
      setPossibleMoves([]);
    },
    [currentGame],
  );

  // ─── selectSquare ─────────────────────────────────────────────────────────
  const selectSquare = useCallback(
    (square: string) => {
      if (!currentGame || currentGame.status !== 'active') return;

      const currentTurn = currentGame.board.split(' ')[1]; // 'w' | 'b'
      const myTurn =
        (playerColor === 'white' && currentTurn === 'w') ||
        (playerColor === 'black' && currentTurn === 'b');

      // 1. If it's a move execution (clicking a possible move)
      if (selectedSquare && possibleMoves.includes(square)) {
        if (!myTurn) return; // Only move on your turn
        makeMove(selectedSquare, square);
        return;
      }

      // 2. If it's a piece selection
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Select new square — possible moves are fetched by the effect above.
      // We allow selecting ANY square (to see info) but only fetch moves 
      // if it's the player's turn to keep the UI snappy and reduce server load.
      setSelectedSquare(square);
      setPossibleMoves([]);
      
      if (!myTurn) {
        // Just show selection, don't ask server for moves if it's not our turn
        return;
      }
    },
    [selectedSquare, possibleMoves, makeMove, currentGame, playerColor],
  );

  // ─── timeout watcher ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentGame || currentGame.status !== 'active') return;
    if (currentGame.whiteTime === undefined || currentGame.blackTime === undefined) return;
    
    const turn = currentGame.board.split(' ')[1]; // 'w' or 'b'
    const activeColor = turn === 'w' ? 'white' : 'black';
    const timeRemaining = activeColor === 'white' ? currentGame.whiteTime : currentGame.blackTime;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (currentGame.lastMoveAt || Date.now());
      if (timeRemaining - elapsed <= 0) {
        socketService.emit('claim_timeout', { gameId: currentGame.gameId });
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentGame]);

  // ─── resignGame ───────────────────────────────────────────────────────────
  const resignGame = useCallback(() => {
    if (!currentGame || currentGame.status !== 'active') return;
    socketService.resignGame();
  }, [currentGame]);

  // ─── requestNewGame ───────────────────────────────────────────────────────
  const requestNewGame = useCallback(() => {
    if (!currentGame) return;
    socketService.requestNewGame();
  }, [currentGame]);

  // ─── sendMessage ──────────────────────────────────────────────────────────
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    socketService.sendMessage(message);
  }, []);

  // ─── Public interface ──────────────────────────────────────────────────────
  const requestRematch = useCallback(() => {
    if (!currentGame) return;
    socketService.emit('request_rematch', { gameId: currentGame.gameId });
    setRematchStatus('requested');
  }, [currentGame, setRematchStatus]);

  const acceptRematch = useCallback(() => {
    if (!currentGame) return;
    socketService.emit('accept_rematch', { gameId: currentGame.gameId });
    setRematchStatus('none');
  }, [currentGame, setRematchStatus]);

  const declineRematch = useCallback(() => {
    if (!currentGame) return;
    socketService.emit('decline_rematch', { gameId: currentGame.gameId });
    setRematchStatus('none');
  }, [currentGame, setRematchStatus]);

  return {
    currentGame,
    chatMessages,
    playerColor,
    selectedSquare,
    possibleMoves,
    isLoadingMoves,
    rematchStatus,
    selectSquare,
    makeMove,
    resignGame,
    requestNewGame,
    sendMessage,
    requestRematch,
    acceptRematch,
    declineRematch,
  };
};