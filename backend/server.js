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
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Ensure Redis is connected once on startup
connectRedis().catch((err) => {
  console.error('Failed to connect to Redis:', err);
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
  console.log(`User connected: ${socket.id}`);

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