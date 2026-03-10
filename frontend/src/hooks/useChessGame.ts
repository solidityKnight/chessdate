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
  // playerColor is a stable string ('white'|'black'|null) — safe as its own selector.
  const playerColor  = useGameStore((s) => s.currentGame?.playerColor ?? null);

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

      /*
       * BUG FIX (turn guard): the original derived `currentTurn` from
       * `currentGame.board?.split(' ')[1]` which is correct — chess.js FEN
       * always has the active colour as the second space-separated field.
       * However when `playerColor` was null (because the selector was
       * recreating a new object on every render and causing a race), this
       * comparison always evaluated to false, silently blocking every click.
       *
       * Now that playerColor comes from a stable scalar selector above, this
       * guard works correctly: it only allows interaction on the player's turn.
       */
      if (playerColor) {
        const currentTurn = currentGame.board.split(' ')[1]; // 'w' | 'b'
        const myTurn =
          (playerColor === 'white' && currentTurn === 'w') ||
          (playerColor === 'black' && currentTurn === 'b');
        if (!myTurn) return;
      }

      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      if (selectedSquare && possibleMoves.includes(square)) {
        // Execute move
        makeMove(selectedSquare, square);
        return;
      }

      // Select new square — possible moves are fetched by the effect above.
      setSelectedSquare(square);
      setPossibleMoves([]);
    },
    [selectedSquare, possibleMoves, makeMove, currentGame, playerColor],
  );

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
  return {
    currentGame,
    chatMessages,
    playerColor,
    selectedSquare,
    possibleMoves,
    isLoadingMoves,
    selectSquare,
    makeMove,
    resignGame,
    requestNewGame,
    sendMessage,
  } as const;
};