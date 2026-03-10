// Socket.IO configuration
const socketConfig = {
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },

  // Socket.IO server options
  options: {
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true, // Allow Engine.IO v3 clients
    transports: ['websocket', 'polling']
  },

  // Game room configuration
  rooms: {
    maxPlayersPerRoom: 2,
    roomPrefix: 'game_'
  },

  // Matchmaking configuration
  matchmaking: {
    queueTimeout: 300000, // 5 minutes
    maxQueueSize: 1000
  },

  // Game configuration
  game: {
    disconnectTimeout: 10000, // 10 seconds
    maxChatMessageLength: 500,
    maxChatHistorySize: 100
  }
};

module.exports = socketConfig;