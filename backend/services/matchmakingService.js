const { redisClient } = require('../redis/redisClient');
const locationService = require('./locationService');

class MatchmakingService {
  constructor() {
    this.maleQueue = 'male_queue';
    this.femaleQueue = 'female_queue';
    this.ELO_RANGE = 200;
  }

  // Add player to matchmaking queue
  async addToQueue(socketId, gender, userData = {}) {
    try {
      // Prevent duplicate entries
      await this.removeFromQueue(socketId);

      const queue = gender === 'male' ? this.maleQueue : this.femaleQueue;

      // Add player to queue with detailed info
      const playerInfo = {
        socketId,
        gender,
        userId: userData.userId || null,
        eloRating: userData.eloRating || 1200,
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        preferredDistance: userData.preferredDistance || Infinity,
        joinedAt: Date.now()
      };

      await redisClient.rPush(queue, JSON.stringify(playerInfo));

      console.log(`Player ${socketId} (${gender}) added to queue with Elo ${playerInfo.eloRating}`);

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
    } catch (error) {
      console.error('Error removing player from queue:', error);
    }
  }

  // Check if there's a match available
  async checkForMatch() {
    try {
      const malePlayersData = await redisClient.lRange(this.maleQueue, 0, -1);
      const femalePlayersData = await redisClient.lRange(this.femaleQueue, 0, -1);

      if (malePlayersData.length === 0 || femalePlayersData.length === 0) {
        return null;
      }

      // We'll iterate through one queue and try to find a match in the other
      // To be fair, we'll start with the player who has been waiting longest
      for (let i = 0; i < malePlayersData.length; i++) {
        const malePlayer = JSON.parse(malePlayersData[i]);
        
        let bestMatchIdx = -1;
        let bestMatchScore = -1;

        for (let j = 0; j < femalePlayersData.length; j++) {
          const femalePlayer = JSON.parse(femalePlayersData[j]);
          
          // 1. Distance filter (Mutual check)
          const distance = locationService.getDistance(
            malePlayer.latitude, malePlayer.longitude,
            femalePlayer.latitude, femalePlayer.longitude
          );

          const maleWithinRadius = malePlayer.preferredDistance === Infinity || distance <= malePlayer.preferredDistance;
          const femaleWithinRadius = femalePlayer.preferredDistance === Infinity || distance <= femalePlayer.preferredDistance;

          if (!maleWithinRadius || !femaleWithinRadius) continue;

          // 2. Elo range filter (+/- 200)
          const eloDiff = Math.abs(malePlayer.eloRating - femalePlayer.eloRating);
          if (eloDiff > this.ELO_RANGE) continue;

          // If we are here, we have a valid match!
          // Score the match based on wait time and Elo similarity
          const eloScore = (this.ELO_RANGE - eloDiff) / this.ELO_RANGE;
          const waitTimeScore = (Date.now() - femalePlayer.joinedAt) / 1000000; // Small weight for wait time
          const currentScore = eloScore + waitTimeScore;

          if (currentScore > bestMatchScore) {
            bestMatchScore = currentScore;
            bestMatchIdx = j;
          }
        }

        if (bestMatchIdx !== -1) {
          // Found a match!
          const femalePlayer = JSON.parse(femalePlayersData[bestMatchIdx]);

          // Remove both from Redis
          await redisClient.lRem(this.maleQueue, 0, malePlayersData[i]);
          await redisClient.lRem(this.femaleQueue, 0, femalePlayersData[bestMatchIdx]);

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