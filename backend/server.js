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

// Define PORT before using it in CORS configuration
const PORT = process.env.PORT || 4000;

// Configure Socket.IO with CORS
// configure socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow same origin (when frontend is served from backend)
      if (origin === `http://localhost:${PORT}` ||
          origin === `https://localhost:${PORT}` ||
          origin.startsWith('https://web-production-') ||
          origin.includes('railway.app')) {
        return callback(null, true);
      }

      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000,
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
    port: PORT,
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
      port: PORT,
      node_env: process.env.NODE_ENV || 'development',
      frontend_url: process.env.FRONTEND_URL || 'not set',
    },
    socket: {
      clients: io.engine.clientsCount,
      cors_origin: 'configured with function',
    },
  });
});

// Test socket.io endpoint
app.get('/socket-test', (req, res) => {
  res.json({
    message: 'Socket.io server is running',
    socket_clients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
    server_info: {
      port: PORT,
      node_env: process.env.NODE_ENV,
      cors_allowed: true,
    },
  });
});

// Test frontend serving
app.get('/frontend-test', (req, res) => {
  const staticPath = path.join(__dirname, '..', 'frontend', 'build');
  const indexPath = path.join(staticPath, 'index.html');

  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      error: 'Frontend build not found',
      static_path: staticPath,
      exists: require('fs').existsSync(staticPath),
      files: require('fs').existsSync(staticPath) ? require('fs').readdirSync(staticPath) : [],
    });
  }
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
      // Skip API routes
      if (req.path.startsWith('/health') ||
          req.path.startsWith('/debug') ||
          req.path.startsWith('/socket-test')) {
        return 'next';
      }
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    console.log('✅ Serving frontend build from', staticPath);
  } catch {
    // build directory doesn't exist; ignore
    console.log('❌ No frontend build found; skipping static middleware');
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  console.log(`   Origin: ${socket.handshake.headers.origin || 'none'}`);
  console.log(`   User-Agent: ${socket.handshake.headers['user-agent']?.substring(0, 50)}...`);
  console.log(`   Transport: ${socket.conn.transport.name}`);
  console.log(`   Total clients: ${io.engine.clientsCount}`);

  // Initialize socket handlers
  matchmakingSocket(socket, io);
  gameSocket(socket, io);
  chatSocket(socket, io);

  socket.on('disconnect', async (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
    // Handle player disconnection and remove from matchmaking queues
    await matchmakingService.removeFromQueue(socket.id);
    gameManager.handlePlayerDisconnect(socket.id, io);
  });

  // Log when client sends any event
  socket.onAny((event, ...args) => {
    console.log(`📨 Socket ${socket.id} sent: ${event}`, args.length > 0 ? '(with data)' : '');
  });
});

server.listen(PORT, () => {
  const fs = require('fs');
  const staticPath = path.join(__dirname, '..', 'frontend', 'build');
  const staticFilesPresent = fs.existsSync(staticPath);

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'not set (CORS allows any)'}`);
  console.log(`📁 Static files: ${staticFilesPresent ? '✅ present' : '❌ missing'}`);
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