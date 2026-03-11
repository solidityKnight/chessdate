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

// ─── Global Error Handlers ────────────────────────────────────────────────────

process.on('uncaughtException', (err) => { 
  console.error('❌ UNCAUGHT EXCEPTION:', err); 
  process.exit(1); 
}); 

process.on('unhandledRejection', (reason, promise) => { 
  console.error('❌ UNHANDLED REJECTION:', reason); 
  process.exit(1); 
});

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;

// Trust Railway's proxy (for HTTPS detection, IP logging, etc.)
app.set('trust proxy', 1);

// ─── CORS origin list ─────────────────────────────────────────────────────────

/**
 * Checks if a given origin is allowed to connect.
 * Supports Railway domains, local dev, and same-origin.
 */
function checkOrigin(origin, callback) {
  // same-origin / mobile / curl
  if (!origin) return callback(null, true);

  const isRailway = origin.includes('railway.app') || origin.includes('up.railway.app');
  const isCustom  = origin.includes('chessdate.in');
  const isLocal   = process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:'));
  const isExplicit = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

  if (isRailway || isCustom || isLocal || isExplicit) {
    return callback(null, true);
  }

  console.log('🚫 CORS blocked origin:', origin);
  return callback(new Error('Not allowed by CORS'), false);
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────

const io = socketIo(server, {
  cors: {
    origin:      checkOrigin,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  /*
   * FIX: list websocket first so Railway's proxy upgrades immediately.
   */
  transports:   ['websocket', 'polling'],
  allowEIO3:    true,
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

// ─── Express middleware ───────────────────────────────────────────────────────

// Simple request logger for debugging 502/timeouts
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`🐢 SLOW REQUEST: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    } else {
      console.log(`📡 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

app.use(helmet({
  // Relax CSP for development/production debugging
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: checkOrigin, credentials: true }));
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
 * FIX: Reliable static file serving for Railway.
 * We resolve the path relative to the process root (cwd) for better consistency
 * during Railway builds and deployments.
 */
const staticPath = path.resolve(process.cwd(), 'frontend', 'build');

console.log('🔍 Deployment Diagnostics:');
console.log('   - Port:', PORT);
console.log('   - Node Env:', process.env.NODE_ENV || 'development');
console.log('   - Process CWD:', process.cwd());
console.log('   - Static Path:', staticPath);
console.log('   - Static Files Check:', fs.existsSync(path.join(staticPath, 'index.html')) ? '✅ Found index.html' : '❌ index.html NOT FOUND');

if (fs.existsSync(path.join(staticPath, 'index.html'))) {
  // Use long-lived caching for static assets in production, but no cache for index.html
  app.use(express.static(staticPath, {
    maxAge: '1d',
    index:  false, // We handle index.html manually via the catch-all
  }));

  // Catch-all: return index.html for any non-API route (React Router support)
  app.get('*', (req, res) => {
    // Skip if it's an API-like route or socket.io
    if (req.path.startsWith('/health') ||
        req.path.startsWith('/debug')  ||
        req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Log what requests are hitting the catch-all
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
      console.warn(`⚠️ Request for asset ${req.path} fell through to catch-all. This usually means express.static failed to find it in ${staticPath}`);
    }
    
    // Serve index.html with no-cache headers to ensure users always get the latest version
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        console.error(`❌ Error sending index.html: ${err.message}`);
        res.status(500).send('Server Error');
      }
    });
  });

  console.log('✅ Serving frontend from', staticPath);
} else {
  console.log('❌ CRITICAL: Frontend build not found at', staticPath);
  console.log('   Check: Does "npm run build" in the root finish successfully?');
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

// For Railway, we MUST listen on the provided PORT and ideally on 0.0.0.0
// to allow the proxy to reach the container.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${fs.existsSync(staticPath) ? '✅ present' : '❌ missing'}`);
  console.log(`🔍 PID: ${process.pid}`);
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