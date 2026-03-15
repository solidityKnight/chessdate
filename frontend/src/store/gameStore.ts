import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { tokenStorage } from '../services/tokenStorage';

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

export interface PlayerPreview {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
  country?: string;
  isProfilePhotoVerified?: boolean;
  lastActiveAt?: string;
}

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
  whiteTime?:    number;
  blackTime?:    number;
  lastMoveAt?:   number;
  opponentProfile?: PlayerPreview | null;
  playerProfiles?: {
    white?: PlayerPreview | null;
    black?: PlayerPreview | null;
  };
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
  displayName?: string;
  age?: number;
  bio?: string;
  interests?: string[];
  profilePhoto?: string;
  isProfilePhotoVerified?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  preferredMatchDistance?: number;
  matchPreferences?: Array<'male' | 'female'>;
  learnMode?: boolean;
  lastActiveAt?: string;
  profileCompletion?: number;
  isOnline?: boolean;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  maxWinStreak: number;
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
  selectedGender: 'male' | 'female' | 'any' | null;
  queueStats:     { male: number; female: number; total: number } | null;
  currentGame:    CurrentGame | null;
  chatMessages:   ChatMessage[];
  isConnected:    boolean;
  error:          string | null;
  rematchStatus:  'none' | 'requested' | 'received' | 'declined';
  isAuthLoading:  boolean;
  unreadFriendMessages: number;

  setUser:           (user: User | null) => void;
  setToken:          (token: string | null) => void;
  setInQueue:        (inQueue: boolean) => void;
  setSelectedGender: (gender: 'male' | 'female' | 'any' | null) => void;
  setQueueStats:     (stats: { male: number; female: number; total: number } | null) => void;
  setCurrentGame:    (game: CurrentGame | null) => void;
  setRematchStatus:  (status: 'none' | 'requested' | 'received' | 'declined') => void;
  setAuthLoading:    (isLoading: boolean) => void;
  setUnreadFriendMessages: (count: number) => void;
  updateBoard:    (board: string, move?: MoveRecord, gameStatus?: GameStatus, timeUpdate?: { whiteTime?: number, blackTime?: number, lastMoveAt?: number }) => void;
  setGameStatus:  (status: 'waiting' | 'active' | 'finished', winner?: 'white' | 'black', result?: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setConnected:   (connected: boolean) => void;
  setError:       (error: string | null) => void;
  reset:          () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: Pick<
  GameStore,
  'user' | 'token' | 'isInQueue' | 'selectedGender' | 'queueStats' | 'currentGame' | 'chatMessages' | 'isConnected' | 'error' | 'rematchStatus' | 'isAuthLoading' | 'unreadFriendMessages'
> = {
  user:           null,
  token:          tokenStorage.get(),
  isInQueue:      false,
  selectedGender: null,
  queueStats:     null,
  currentGame:    null,
  chatMessages:   [],
  isConnected:    false,
  error:          null,
  rematchStatus:  'none',
  isAuthLoading:  !!tokenStorage.get(),
  unreadFriendMessages: 0,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser:           (user)           => set({ user, isAuthLoading: false }),
        setToken:          (token)          => {
          tokenStorage.set(token);
          set({ token });
        },
        setInQueue:        (isInQueue)      => set({ isInQueue }),
        setSelectedGender: (selectedGender) => set({ selectedGender }),
        setQueueStats:     (queueStats)     => set({ queueStats }),
        setCurrentGame:    (currentGame)    => set({ currentGame }),
        setRematchStatus:  (rematchStatus)  => set({ rematchStatus }),
        setAuthLoading:    (isAuthLoading)  => set({ isAuthLoading }),
        setUnreadFriendMessages: (unreadFriendMessages) => set({ unreadFriendMessages }),

        updateBoard: (board, move, gameStatus, timeUpdate) =>
          set((state) => {
            if (!state.currentGame) return state;
            return {
              currentGame: {
                ...state.currentGame,
                board,
                ...(move       ? { moves: [...state.currentGame.moves, move] } : {}),
                ...(gameStatus ? { gameStatus }                                : {}),
                ...(timeUpdate ? { ...timeUpdate }                             : {}),
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
        reset:        () => set((state) => ({
          ...initialState,
          isConnected: state.isConnected, // Preserve connection state
          user: state.user, // Preserve user state
          token: state.token, // Preserve token state
          unreadFriendMessages: state.unreadFriendMessages,
          isAuthLoading: !!state.token && !state.user,
        })),
      }),
      {
        name: 'game-store-v4',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token, 
          currentGame: state.currentGame 
        }),
        onRehydrateStorage: () => (state) => {
          if (state) state.setAuthLoading(!!state.token && !state.user);
        }
      }
    )
  ),
);
