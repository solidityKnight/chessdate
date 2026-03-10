const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { Chess } = require('chess.js');

// Import socket handlers
const matchmakingSocket = require('./sockets/matchmaking');
const gameSocket = require('./sockets/gameSocket');
const chatSocket = require('./sockets/chatSocket');

// Import services
const matchmakingService = require('./services/matchmakingService');
const gameManager = require('./services/gameManager');
const { redisClient, connectRedis } = require('./redis/redisClient');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
// configure socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      // when frontend is served from the same domain we can allow any
      // origin since the static middleware serves it.
      true,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
  });
});

// Debug endpoint for troubleshooting
app.get('/debug', (req, res) => {
  res.json({
    redis: {
      connected: redisClient.isOpen,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
    server: {
      port: process.env.PORT || 4000,
      node_env: process.env.NODE_ENV || 'development',
      frontend_url: process.env.FRONTEND_URL || 'not set',
    },
    socket: {
      clients: io.engine.clientsCount,
    },
  });
});

// Ensure Redis is connected once on startup
connectRedis().catch((err) => {
  console.error('Failed to connect to Redis:', err);
  console.error('Redis config:', {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  });
});

// Serve frontend build if it exists or if explicitly requested.
// Railway builds the frontend during install, so the directory should be
// present. The NODE_ENV check is helpful for local testing, but we also
// allow forcing with SERVE_FRONTEND.
{
  const staticPath = path.join(__dirname, '..', 'frontend', 'build');
  try {
    require('fs').accessSync(staticPath);
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    console.log('Serving frontend build from', staticPath);
  } catch {
    // build directory doesn't exist; ignore
    console.log('No frontend build found; skipping static middleware');
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} from ${socket.handshake.address}`);

  // Initialize socket handlers
  matchmakingSocket(socket, io);
  gameSocket(socket, io);
  chatSocket(socket, io);

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    // Handle player disconnection and remove from matchmaking queues
    await matchmakingService.removeFromQueue(socket.id);
    gameManager.handlePlayerDisconnect(socket.id, io);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set (CORS allows any)'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    redisClient.quit();
    process.exit(0);
  });
});

module.exports = { app, server, io };