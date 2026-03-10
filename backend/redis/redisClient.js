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
    console.log('Redis: connecting via REDIS_URL');
    return { url: process.env.REDIS_URL };
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  console.log(`Redis: connecting via host=${host} port=${port}`);
  return { socket: { host, port } };
}

const redisClient = redis.createClient(createRedisConfig());

redisClient.on('error', (err) => {
  console.error('Redis client error:', err.message);
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = { redisClient, connectRedis };