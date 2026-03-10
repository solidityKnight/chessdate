'use strict';

const express  = require('express');
const http     = require('http');
const path     = require('path');
const fs       = require('fs');
const socketIo = require('socket.io');
const cors     = require('cors');
const helmet   = require('helmet');

// Import socket handlers
const matchmakingSocket = require('./sockets/matchmaking');
const gameSocket        = require('./sockets/gameSocket');
const chatSocket        = require('./sockets/chatSocket');

// Import services
const matchmakingService          = require('./services/matchmakingService');
const gameManager                 = require('./services/gameManager');
const { redisClient, connectRedis } = require('./redis/redisClient');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;

// ─── CORS origin list ─────────────────────────────────────────────────────────

function isAllowedOrigin(origin) {
  if (!origin) return true;                          // curl / mobile / same-origin

  // Explicit production domain (set FRONTEND_URL in Railway if needed)
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;

  // Any Railway deployment URL
  if (origin.includes('railway.app')) return true;
  if (origin.includes('up.railway.app')) return true;

  // Local development
  if (process.env.NODE_ENV !== 'production') {
    if (origin.startsWith('http://localhost:')) return true;
    if (origin.startsWith('https://localhost:')) return true;
  }

  return false;
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  /*
   * FIX: list websocket first so Railway's proxy upgrades immediately.
   * Starting with polling works locally but causes Railway's load balancer
   * to sometimes drop the upgrade request, leaving clients on long-polling
   * or stuck in a reconnect loop.
   */
  transports:   ['websocket', 'polling'],
  allowEIO3:    true,
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

// ─── Express middleware ───────────────────────────────────────────────────────

app.use(helmet({
  // Allow socket.io scripts and same-origin requests
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: isAllowedOrigin, credentials: true }));
app.use(express.json());

// ─── Health / debug endpoints ─────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    redis:       redisClient.isOpen ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    port:        PORT,
  });
});

app.get('/debug', (_req, res) => {
  res.json({
    redis:  { connected: redisClient.isOpen },
    server: { port: PORT, node_env: process.env.NODE_ENV || 'development' },
    socket: { clients: io.engine.clientsCount },
  });
});

// ─── Redis ────────────────────────────────────────────────────────────────────

connectRedis().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err.message);
});

// ─── Frontend static files ────────────────────────────────────────────────────

/*
 * FIX: __dirname here is chess/backend, so the build folder is one level up.
 * Supports both monorepo layouts:
 *   chess/frontend/build   ← standard
 *   chess/build            ← if root-level build is ever used
 */
const staticPath = path.join(__dirname, '..', 'frontend', 'build');

if (fs.existsSync(path.join(staticPath, 'index.html'))) {
  app.use(express.static(staticPath));

  // Catch-all: return index.html for any non-API route (React Router support)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/health') ||
        req.path.startsWith('/debug')  ||
        req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  console.log('✅ Serving frontend from', staticPath);
} else {
  console.log('❌ No frontend build found at', staticPath);
  console.log('   Run: cd frontend && npm run build');
}

// ─── Socket connection handling ───────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id} via ${socket.conn.transport.name} (total: ${io.engine.clientsCount})`);

  matchmakingSocket(socket, io);
  gameSocket(socket, io);
  chatSocket(socket, io);

  socket.on('disconnect', async (reason) => {
    console.log(`🔌 Disconnected: ${socket.id}, reason: ${reason}`);
    await matchmakingService.removeFromQueue(socket.id);
    gameManager.handlePlayerDisconnect(socket.id, io);
  });

  socket.onAny((event) => {
    console.log(`📨 ${socket.id} → ${event}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${fs.existsSync(staticPath) ? '✅ present' : '❌ missing'}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    redisClient.quit();
    process.exit(0);
  });
});

module.exports = { app, server, io };