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
const friendChatSocket  = require('./sockets/friendChatSocket');

// Import services
const matchmakingService          = require('./services/matchmakingService');
const gameManager                 = require('./services/gameManager');
const botService                  = require('./services/BotService');
const settingsService             = require('./services/SettingsService');
const { redisClient, connectRedis } = require('./redis/redisClient');
const { sequelize, User }         = require('./models');
const jwt                         = require('jsonwebtoken');

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
const server = http.createServer((req, res) => {
  if (typeof req.url === 'string' && req.url.startsWith('/socket.io')) {
    return;
  }
  app(req, res);
});
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

  if (process.env.ALLOW_ALL_ORIGINS === 'true') {
    return callback(null, true);
  }

  const normalize = (value) => {
    try {
      return new URL(value).origin;
    } catch {
      return String(value || '').replace(/\/+$/, '');
    }
  };

  const isPrivateLanOrigin = (value) => {
    try {
      const u = new URL(value);
      const host = u.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (host.startsWith('192.168.')) return true;
      if (host.startsWith('10.')) return true;
      const m = host.match(/^172\.(\d+)\./);
      if (m) {
        const n = Number(m[1]);
        if (n >= 16 && n <= 31) return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isRailway = origin.includes('railway.app') || origin.includes('up.railway.app');
  const isCustom  = origin.includes('chessdate.in') || origin.includes('www.chessdate.in');
  const isLocal   = process.env.NODE_ENV !== 'production' && (isPrivateLanOrigin(origin) || origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:'));
  const explicitList = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => normalize(o.trim())).filter(Boolean)
    : [];
  const isExplicit = explicitList.length > 0 && explicitList.includes(normalize(origin));

  if (isRailway || isCustom || isLocal || isExplicit) {
    return callback(null, true);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    try {
      const url = new URL(origin);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return callback(null, true);
      }
    } catch {}
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
  transports:   ['polling', 'websocket'],
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
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: checkOrigin, credentials: true }));
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/users/search', require('./routes/searchRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));

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

// ─── Database (PostgreSQL) ───────────────────────────────────────────────────

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ PostgreSQL connected and synced');
    // Load system settings into memory cache
    await settingsService.loadAll();
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ─── Frontend static files ────────────────────────────────────────────────────

const repoRoot  = path.resolve(__dirname, '..');
const staticPath = path.resolve(repoRoot, 'frontend', 'build');

console.log('🔍 Deployment Diagnostics:');
console.log('   - Port:', PORT);
console.log('   - Node Env:', process.env.NODE_ENV || 'development');
console.log('   - Process CWD:', process.cwd());
console.log('   - Static Path:', staticPath);
console.log('   - Static Files Check:', fs.existsSync(path.join(staticPath, 'index.html')) ? '✅ Found index.html' : '❌ index.html NOT FOUND');

if (fs.existsSync(path.join(staticPath, 'index.html'))) {
  app.use(express.static(staticPath, {
    maxAge: '1d',
    index:  false,
  }));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/health') ||
        req.path.startsWith('/debug')  ||
        req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
      console.warn(`⚠️ Request for asset ${req.path} fell through to catch-all. This usually means express.static failed to find it in ${staticPath}`);
    }
    
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

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      const user = await User.findByPk(decoded.id);
      if (user) {
        socket.user = user;
        return next();
      }
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
    }
  }
  socket.user = null;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id} via ${socket.conn.transport.name} (total: ${io.engine.clientsCount})`);

  matchmakingSocket(socket, io);
  gameSocket(socket, io);
  chatSocket(socket, io);
  friendChatSocket(socket, io);

  socket.on('disconnect', async (reason) => {
    console.log(`🔌 Disconnected: ${socket.id}, reason: ${reason}`);

    // Cancel any pending bot fallback timer
    botService.cancelFallbackTimer(socket.id);

    await matchmakingService.removeFromQueue(socket.id);
    gameManager.handlePlayerDisconnect(socket.id, io);
  });

  socket.onAny((event) => {
    console.log(`📨 ${socket.id} → ${event}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the process using it or set a different PORT (e.g. 4001) and restart.`);
    process.exit(1);
  }
  throw err;
});

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
