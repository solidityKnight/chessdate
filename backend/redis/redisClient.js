const redis = require('redis');

// Single shared Redis client for the entire backend
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = {
  redisClient,
  connectRedis,
};