import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import type { MoveRecord, GameStatus, ChatMessage } from '../store/gameStore';
import { envConfig } from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts    = 0;
  private maxReconnectAttempts = 5;

  // ─── Connection ───────────────────────────────────────────────────────────

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    /*
     * BUG FIX: the original tried several URL derivations but the most
     * important case — same-origin Railway deployment where frontend and
     * backend share one domain — was broken because the socket options
     * forced 'polling' first and set forceNew every time, which caused
     * Railway's proxy to reject the upgrade.
     *
     * Rule:
     *  - In production (same origin): connect to window.location.origin,
     *    let socket.io negotiate transport naturally (websocket preferred).
     *  - In local dev: if no REACT_APP_BACKEND_URL is set and we're on
     *    port 3000, override to port 4000 where the backend runs.
     */
    const isLocalhost = window.location.hostname === 'localhost';
    // For same-origin deployment, let socket.io determine the URL automatically.
    // In production, we'll use window.location.origin to be explicit for the proxy.
    const backendUrl  = isLocalhost ? envConfig.backendUrl : window.location.origin;

    console.log(`🔌 Socket: Initializing connection... (Target: ${backendUrl})`);

    const token = localStorage.getItem('token');

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20_000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      secure: window.location.protocol === 'https:',
      auth: { token }
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

  // ─── Public event subscription ────────────────────────────────────────────

  on<T = unknown>(event: string, handler: (data: T) => void): void {
    this.socket?.on(event, handler);
  }

  off<T = unknown>(event: string, handler: (data: T) => void): void {
    this.socket?.off(event, handler);
  }

  emit<T = unknown>(event: string, data?: T): void {
    this.socket?.emit(event, data);
  }

  // ─── Internal event listeners ─────────────────────────────────────────────

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected, socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setError(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected, reason:', reason);
      useGameStore.getState().setConnected(false);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.reconnectAttempts++;
      const msg = this.reconnectAttempts >= this.maxReconnectAttempts
        ? 'Max reconnection attempts reached. Please refresh.'
        : `Connecting to server... (attempt ${this.reconnectAttempts})`;
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
      players?:      { white: string; black: string };
    }) => {
      useGameStore.getState().setInQueue(false);
      useGameStore.getState().setQueueStats(null);

      // Derive color from socket id when the players map is available.
      // This is the safest source of truth since the server now emits
      // individual payloads per player (matchmaking.js fix).
      const socketId = this.socket?.id;
      let playerColor:   'white' | 'black' = data.playerColor;
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
        gameId:     data.gameId,
        playerColor,
        opponentColor,
        board:      data.board,
        status:     'active',
        moves:      [],
        gameStatus: { status: 'active' },
      });
    });

    this.socket.on('queue_stats', (stats: { male: number; female: number; total: number }) => {
      useGameStore.getState().setQueueStats(stats);
    });

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

    this.socket.on('ready_for_new_match', () => {
      useGameStore.getState().reset();
    });

    this.socket.on('game_cleanup_complete', () => {
      useGameStore.getState().reset();
    });

    this.socket.on('opponent_requested_new_game', () => {
      useGameStore.getState().setError(null);
    });

    this.socket.on('chat_message', (data: ChatMessage) => {
      useGameStore.getState().addChatMessage(data);
    });

    this.socket.on('chat_history', (data: { messages: ChatMessage[] }) => {
      data.messages.forEach((msg) => useGameStore.getState().addChatMessage(msg));
    });

    this.socket.on('error', (data: { message: string }) => {
      useGameStore.getState().setError(data.message);
    });

    this.socket.on('invalid_move', (data: { error: string }) => {
      useGameStore.getState().setError(data.error);
    });
  }

  // ─── Matchmaking ──────────────────────────────────────────────────────────

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

  // ─── Game ─────────────────────────────────────────────────────────────────

  makeMove(from: string, to: string, promotion?: string): void {
    if (!this.socket) return;
    const gameId = useGameStore.getState().currentGame?.gameId;
    if (!gameId) return;
    this.socket.emit('make_move', { gameId, from, to, promotion });
  }

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

  getPossibleMoves(gameId: string, square: string): void {
    if (!this.socket) return;
    this.socket.emit('get_possible_moves', { gameId, square });
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

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

  // ─── Utilities ────────────────────────────────────────────────────────────

  getSocket(): Socket | null { return this.socket; }
  isConnected(): boolean     { return this.socket?.connected ?? false; }
}

export const socketService = new SocketService();