'use strict';

const redis = require('redis');

/*
 * BUG FIX: the original only supported REDIS_HOST + REDIS_PORT.
 * Railway (and most cloud Redis providers) supply a single REDIS_URL
 * environment variable (e.g. redis://default:password@host:port).
 * When REDIS_URL is set we use it directly; otherwise we fall back to
 * the individual host/port variables for local development.
 */
function createRedisConfig() {
  if (process.env.REDIS_URL) {
    // Mask the password in the URL for logging
    const maskedUrl = process.env.REDIS_URL.replace(/:([^:@]+)@/, ':****@');
    console.log(`Redis: connecting via REDIS_URL (${maskedUrl})`);
    return { url: process.env.REDIS_URL };
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD;
  
  console.log(`Redis: connecting via host=${host} port=${port}${password ? ' (with password)' : ''}`);
  
  const config = {
    socket: {
      host,
      port,
    }
  };

  if (password) {
    config.password = password;
  }

  return config;
}

const config = createRedisConfig();
const redisClient = redis.createClient({
  ...config,
  socket: {
    ...config.socket,
    // Add reconnect strategy for more resilience
    reconnectStrategy: (retries) => {
      // Exponential backoff with a cap
      const delay = Math.min(retries * 500, 10000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms... (attempt ${retries})`);
      return delay;
    }
  }
});

redisClient.on('error', (err) => {
  // Log specific error codes for diagnosis (e.g., ECONNREFUSED, ETIMEDOUT)
  console.error(`❌ Redis client error [${err.code || 'UNKNOWN'}]:`, err.message);
  if (err.message.includes('ECONNREFUSED')) {
    console.warn('   Tip: Check if Redis is running and the port/host are correct.');
  }
});

redisClient.on('connect', () => {
  console.log('🔌 Redis: connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: client ready');
});

redisClient.on('reconnecting', (params) => {
  console.log(`🔄 Redis: client reconnecting... attempt ${params?.attempt || '?'}`);
});

redisClient.on('end', () => {
  console.log('🚪 Redis: client connection closed');
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      console.log('🚀 Redis: starting connection...');
      await redisClient.connect();
    } catch (err) {
      console.error('❌ Redis: initial connection failed:', err.message);
      // The client will automatically try to reconnect if reconnectStrategy is set
    }
  }
}

module.exports = { redisClient, connectRedis };