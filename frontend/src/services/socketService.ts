import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import type { MoveRecord, GameStatus, ChatMessage } from '../store/gameStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts  = 0;
  private maxReconnectAttempts = 5;

  // ─── Connection ─────────────────────────────────────────────────────────────

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    // prefer explicit env var, but fall back to same-origin so the app works
    // when frontend is served from the backend (typical on Railway).
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || window.location.origin || 'http://localhost:4000';

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20_000,
      forceNew: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useGameStore.getState().setConnected(false);
    }
  }

  // ─── Public event subscription ───────────────────────────────────────────────

  /**
   * FIX: `on` and `off` were missing from SocketService, causing TS2339
   * errors in useChessGame.ts.  Exposed as thin wrappers around the underlying
   * socket so callers (hooks, components) can subscribe to arbitrary events
   * without importing socket.io-client directly.
   */
  on<T = unknown>(event: string, handler: (data: T) => void): void {
    this.socket?.on(event, handler);
  }

  off<T = unknown>(event: string, handler: (data: T) => void): void {
    this.socket?.off(event, handler);
  }

  // ─── Internal event listeners ────────────────────────────────────────────────

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setError(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      useGameStore.getState().setConnected(false);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      const msg = this.reconnectAttempts >= this.maxReconnectAttempts
        ? 'Max reconnection attempts reached'
        : 'Failed to connect to server';
      useGameStore.getState().setError(msg);
    });

    // Matchmaking
    this.socket.on('waiting_for_match', (data: { queuePosition: number }) => {
      useGameStore.getState().setInQueue(true);
      useGameStore.getState().setQueueStats(data.queuePosition as any);
    });

    this.socket.on('game_start', (data: {
      gameId:        string;
      playerColor:   'white' | 'black';
      opponentColor: 'white' | 'black';
      board:         string;
      players?: { white: string; black: string };
    }) => {
      useGameStore.getState().setInQueue(false);
      useGameStore.getState().setQueueStats(null);

      // Derive THIS client's colour from the socket id when possible,
      // so each player sees their own pieces at the bottom and the
      // correct "Playing as White/Black" text.
      const socketId = this.socket?.id;
      let playerColor: 'white' | 'black'   = data.playerColor;
      let opponentColor: 'white' | 'black' = data.opponentColor;

      if (socketId && data.players) {
        if (data.players.white === socketId) {
          playerColor   = 'white';
          opponentColor = 'black';
        } else if (data.players.black === socketId) {
          playerColor   = 'black';
          opponentColor = 'white';
        }
      }

      useGameStore.getState().setCurrentGame({
        gameId:        data.gameId,
        playerColor,
        opponentColor,
        board:         data.board,
        status:        'active',
        moves:         [],
        gameStatus:    { status: 'active' },
      });
    });

    this.socket.on('queue_stats', (stats: { male: number; female: number; total: number }) => {
      useGameStore.getState().setQueueStats(stats);
    });

    // Game: move_made
    /**
     * FIX: the original called updateBoard(board) only, discarding the move
     * record and gameStatus from the payload.  Now passes all three so the
     * store stays fully in sync in a single atomic update.
     * 
     * BUG FIX: Removed the premature game status setting. The 'move_made' 
     * event should only update the board and gameStatus, not set the overall
     * game status to finished. The 'game_over' event handles that.
     */
    this.socket.on('move_made', (data: {
      board:      string;
      move:       MoveRecord;
      gameStatus: GameStatus;
    }) => {
      useGameStore.getState().updateBoard(data.board, data.move, data.gameStatus);
    });

    this.socket.on('game_over', (data: {
      winner?: 'white' | 'black';
      result:  string;
    }) => {
      useGameStore.getState().setGameStatus('finished', data.winner, data.result);
    });

    this.socket.on('opponent_disconnected', (data: { winner: 'white' | 'black' }) => {
      useGameStore.getState().setGameStatus('finished', data.winner, 'disconnect');
    });

    // Game: new opponent request
    /**
     * FIX: added missing event handlers for request_new_game flow.
     * When a player requests a new game, both players should:
     * 1. Clear the current game
     * 2. Reset matchmaking state
     * 3. Allow gender selection again
     */
    this.socket.on('ready_for_new_match', () => {
      console.log('Ready for new match');
      useGameStore.getState().reset();
    });

    this.socket.on('game_cleanup_complete', () => {
      console.log('Game cleanup complete');
      useGameStore.getState().reset();
    });

    this.socket.on('opponent_requested_new_game', () => {
      console.log('Opponent requested new game');
      // Optional: could set a message to notify the player
      useGameStore.getState().setError(null);
    });

    // Chat
    this.socket.on('chat_message', (data: ChatMessage) => {
      useGameStore.getState().addChatMessage(data);
    });

    this.socket.on('chat_history', (data: { messages: ChatMessage[] }) => {
      data.messages.forEach((msg) => useGameStore.getState().addChatMessage(msg));
    });

    // Possible moves — consumed directly by useChessGame via .on()/.off()
    // No store update needed; the hook manages this state locally.

    // Errors
    this.socket.on('error', (data: { message: string }) => {
      useGameStore.getState().setError(data.message);
    });

    this.socket.on('invalid_move', (data: { error: string }) => {
      useGameStore.getState().setError(data.error);
    });
  }

  // ─── Matchmaking ─────────────────────────────────────────────────────────────

  selectGender(gender: 'male' | 'female'): void {
    if (!this.socket) return;
    useGameStore.getState().setSelectedGender(gender);
    this.socket.emit('select_gender', { gender });
  }

  cancelMatchmaking(): void {
    if (!this.socket) return;
    this.socket.emit('cancel_matchmaking');
    useGameStore.getState().setInQueue(false);
  }

  // ─── Game ────────────────────────────────────────────────────────────────────

  makeMove(from: string, to: string, promotion?: string): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('make_move', { gameId, from, to, promotion });
  }

  /**
   * FIX: the original accepted no arguments and read gameId from the store
   * internally — which is correct.  useChessGame.ts was erroneously passing
   * gameId as an argument (TS2554: expected 0, got 1).  The method signature
   * is kept as-is (no parameter); useChessGame.ts is fixed to not pass one.
   */
  resignGame(): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('resign_game', { gameId });
  }

  requestNewGame(): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('request_new_game', { gameId });
  }

  /**
   * FIX: getPossibleMoves was missing entirely (TS2339).  Added to emit
   * get_possible_moves with the canonical gameId from the store.
   */
  getPossibleMoves(gameId: string, square: string): void {
    if (!this.socket) return;
    this.socket.emit('get_possible_moves', { gameId, square });
  }

  // ─── Chat ────────────────────────────────────────────────────────────────────

  sendMessage(message: string): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('send_message', { gameId, message });
  }

  getChatHistory(): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('get_chat_history', { gameId });
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  getSocket(): Socket | null { return this.socket; }
  isConnected(): boolean     { return this.socket?.connected ?? false; }
}

export const socketService = new SocketService();