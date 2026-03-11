import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface MoveRecord {
  from:      string;
  to:        string;
  san:       string;
  piece:     string;
  captured:  string | null;
  promotion: string | null;
  timestamp: number;
}

export interface GameStatus {
  status: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'error';
  winner?: 'white' | 'black';
  reason?: string;
}

export interface ChatMessage {
  playerId:    string;
  playerColor: 'white' | 'black';
  message:     string;
  timestamp:   number;
}

/**
 * FIX: added `moves` and `gameStatus` which were missing from the original
 * type, causing TS2339 errors in ChessBoard.tsx.
 */
export interface CurrentGame {
  gameId:        string;
  playerColor:   'white' | 'black';
  opponentColor: 'white' | 'black';
  board:         string;
  status:        'waiting' | 'active' | 'finished';
  winner?:       'white' | 'black';
  result?:       string;
  moves:         MoveRecord[];
  gameStatus:    GameStatus;
  pickUpLine?:   string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  gender: 'male' | 'female';
  role: 'user' | 'admin';
  credits: number;
  gamesPlayedInCredit: number;
  lastCreditRegen: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    maxWinStreak: number;
  };
  achievements: Array<{
    name: string;
    description: string;
    unlockedAt: string;
  }>;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface GameStore {
  user:           User | null;
  token:          string | null;
  isInQueue:      boolean;
  selectedGender: 'male' | 'female' | null;
  queueStats:     { male: number; female: number; total: number } | null;
  currentGame:    CurrentGame | null;
  chatMessages:   ChatMessage[];
  isConnected:    boolean;
  error:          string | null;
  rematchStatus:  'none' | 'requested' | 'received' | 'declined';

  setUser:           (user: User | null) => void;
  setToken:          (token: string | null) => void;
  setInQueue:        (inQueue: boolean) => void;
  setSelectedGender: (gender: 'male' | 'female' | null) => void;
  setQueueStats:     (stats: { male: number; female: number; total: number } | null) => void;
  setCurrentGame:    (game: CurrentGame | null) => void;
  setRematchStatus:  (status: 'none' | 'requested' | 'received' | 'declined') => void;
  updateBoard:    (board: string, move?: MoveRecord, gameStatus?: GameStatus) => void;
  /**
   * FIX: updateBoard now accepts an optional move record and gameStatus so
   * board, move history, and status are updated atomically in one set() call.
   * Previously they were applied in separate calls, leaving the store
   * partially updated between renders.
   */
  updateBoard:    (board: string, move?: MoveRecord, gameStatus?: GameStatus) => void;
  setGameStatus:  (status: 'waiting' | 'active' | 'finished', winner?: 'white' | 'black', result?: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setConnected:   (connected: boolean) => void;
  setError:       (error: string | null) => void;
  reset:          () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: Pick<
  GameStore,
  'user' | 'token' | 'isInQueue' | 'selectedGender' | 'queueStats' | 'currentGame' | 'chatMessages' | 'isConnected' | 'error' | 'rematchStatus'
> = {
  user:           null,
  token:          localStorage.getItem('token'),
  isInQueue:      false,
  selectedGender: null,
  queueStats:     null,
  currentGame:    null,
  chatMessages:   [],
  isConnected:    false,
  error:          null,
  rematchStatus:  'none',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser:           (user)           => set({ user }),
      setToken:          (token)          => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token });
      },
      setInQueue:        (isInQueue)      => set({ isInQueue }),
      setSelectedGender: (selectedGender) => set({ selectedGender }),
      setQueueStats:     (queueStats)     => set({ queueStats }),
      setCurrentGame:    (currentGame)    => set({ currentGame }),
      setRematchStatus:  (rematchStatus)  => set({ rematchStatus }),

      updateBoard: (board, move, gameStatus) =>
        set((state) => {
          if (!state.currentGame) return state;
          return {
            currentGame: {
              ...state.currentGame,
              board,
              ...(move       ? { moves: [...state.currentGame.moves, move] } : {}),
              ...(gameStatus ? { gameStatus }                                : {}),
            },
          };
        }),

      setGameStatus: (status, winner, result) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, status, winner, result }
            : null,
        })),

      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      setConnected: (isConnected) => set({ isConnected }),
      setError:     (error)       => set({ error }),
      /**
       * FIX: reset() now preserves the current connection state.
       * When a game ends and the player requests a new match, we clear the game
       * and matchmaking state, but the socket connection should remain active
       * so the player can immediately rejoin matchmaking without a reconnection delay.
       */
      reset:        () => set((state) => ({
        ...initialState,
        isConnected: state.isConnected, // Preserve connection state
      })),
    }),
    { name: 'game-store' },
  ),
);