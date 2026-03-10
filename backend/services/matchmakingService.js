const { redisClient } = require('../redis/redisClient');

class MatchmakingService {
  constructor() {
    this.maleQueue = 'male_queue';
    this.femaleQueue = 'female_queue';
  }

  // Add player to matchmaking queue
  async addToQueue(socketId, gender) {
    try {
      const queue = gender === 'male' ? this.maleQueue : this.femaleQueue;

      // Add player to queue with timestamp
      await redisClient.rPush(queue, JSON.stringify({
        socketId,
        gender,
        joinedAt: Date.now()
      }));

      console.log(`Player ${socketId} (${gender}) added to queue`);

      // Check for potential match
      return await this.checkForMatch();
    } catch (error) {
      console.error('Error adding player to queue:', error);
      throw error;
    }
  }

  // Remove player from queues by socketId
  async removeFromQueue(socketId) {
    try {
      const queues = [this.maleQueue, this.femaleQueue];

      for (const queue of queues) {
        const items = await redisClient.lRange(queue, 0, -1);

        for (const item of items) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.socketId === socketId) {
              await redisClient.lRem(queue, 0, item);
            }
          } catch {
            // Ignore invalid JSON entries
          }
        }
      }

      console.log(`Player ${socketId} removed from queue`);
    } catch (error) {
      console.error('Error removing player from queue:', error);
    }
  }

  // Check if there's a match available
  async checkForMatch() {
    try {
      const maleCount = await redisClient.lLen(this.maleQueue);
      const femaleCount = await redisClient.lLen(this.femaleQueue);

      if (maleCount > 0 && femaleCount > 0) {
        // Get players from queues
        const malePlayerData = await redisClient.lPop(this.maleQueue);
        const femalePlayerData = await redisClient.lPop(this.femaleQueue);

        if (malePlayerData && femalePlayerData) {
          const malePlayer = JSON.parse(malePlayerData);
          const femalePlayer = JSON.parse(femalePlayerData);

          // Randomly assign colors
          const players = Math.random() < 0.5 ?
            { white: malePlayer, black: femalePlayer } :
            { white: femalePlayer, black: malePlayer };

          return {
            gameId: this.generateGameId(),
            players: players
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for match:', error);
      return null;
    }
  }

  // Generate unique game ID
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get queue lengths for monitoring
  async getQueueStats() {
    try {
      const maleCount = await redisClient.lLen(this.maleQueue);
      const femaleCount = await redisClient.lLen(this.femaleQueue);

      return {
        male: maleCount,
        female: femaleCount,
        total: maleCount + femaleCount
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { male: 0, female: 0, total: 0 };
    }
  }
}

module.exports = new MatchmakingService();