const { redisClient } = require('../redis/redisClient');
const locationService = require('./locationService');
const safetyService = require('./safetyService');
const { normalizeMatchPreferences } = require('../utils/userPresentation');

class MatchmakingService {
  constructor() {
    this.queueKey = 'matchmaking_queue';
    this.ELO_RANGE = 200;
  }

  async addToQueue(socketId, preferredGender, userData = {}) {
    try {
      await this.removeFromQueue(socketId);

      const matchPreferences =
        preferredGender === 'any'
          ? ['male', 'female']
          : normalizeMatchPreferences(userData.matchPreferences || [preferredGender]);

      const playerInfo = {
        socketId,
        userId: userData.userId || null,
        selfGender: userData.selfGender || userData.gender || null,
        matchPreferences,
        eloRating: userData.eloRating || 1200,
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        preferredDistance:
          Number.isFinite(Number(userData.preferredDistance))
            ? Number(userData.preferredDistance)
            : null,
        joinedAt: Date.now()
      };

      await redisClient.rPush(this.queueKey, JSON.stringify(playerInfo));

      console.log(
        `Player ${socketId} queued with preferences ${playerInfo.matchPreferences.join(',')} and Elo ${playerInfo.eloRating}`
      );

      return await this.checkForMatch();
    } catch (error) {
      console.error('Error adding player to queue:', error);
      throw error;
    }
  }

  async removeFromQueue(socketId) {
    try {
      const items = await redisClient.lRange(this.queueKey, 0, -1);

      for (const item of items) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.socketId === socketId) {
            await redisClient.lRem(this.queueKey, 0, item);
          }
        } catch {
          // Ignore invalid queue entries
        }
      }
    } catch (error) {
      console.error('Error removing player from queue:', error);
    }
  }

  isWithinDistance(playerA, playerB) {
    const distance = locationService.getDistance(
      playerA.latitude, playerA.longitude,
      playerB.latitude, playerB.longitude
    );

    const playerAWithinRadius =
      playerA.preferredDistance == null || distance <= playerA.preferredDistance;
    const playerBWithinRadius =
      playerB.preferredDistance == null || distance <= playerB.preferredDistance;

    return playerAWithinRadius && playerBWithinRadius;
  }

  isPreferenceCompatible(playerA, playerB) {
    if (!playerA.selfGender || !playerB.selfGender) return false;

    const playerAPreferences = normalizeMatchPreferences(playerA.matchPreferences);
    const playerBPreferences = normalizeMatchPreferences(playerB.matchPreferences);

    return (
      playerAPreferences.includes(playerB.selfGender) &&
      playerBPreferences.includes(playerA.selfGender)
    );
  }

  async checkForMatch() {
    try {
      const queueEntries = (await redisClient.lRange(this.queueKey, 0, -1))
        .map((entry) => {
          try {
            return JSON.parse(entry);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (queueEntries.length < 2) {
        return null;
      }

      for (let i = 0; i < queueEntries.length; i++) {
        const playerA = queueEntries[i];
        let bestMatchIndex = -1;
        let bestScore = -1;

        for (let j = i + 1; j < queueEntries.length; j++) {
          const playerB = queueEntries[j];

          if (!this.isPreferenceCompatible(playerA, playerB)) continue;
          if (!this.isWithinDistance(playerA, playerB)) continue;

          const eloDiff = Math.abs(playerA.eloRating - playerB.eloRating);
          if (eloDiff > this.ELO_RANGE) continue;

          if (playerA.userId && playerB.userId) {
            const blocked = await safetyService.areUsersBlocked(playerA.userId, playerB.userId);
            if (blocked) continue;
          }

          const oldestWait = Math.min(playerA.joinedAt, playerB.joinedAt);
          const waitScore = (Date.now() - oldestWait) / 1000000;
          const eloScore = (this.ELO_RANGE - eloDiff) / this.ELO_RANGE;
          const currentScore = waitScore + eloScore;

          if (currentScore > bestScore) {
            bestScore = currentScore;
            bestMatchIndex = j;
          }
        }

        if (bestMatchIndex !== -1) {
          const playerB = queueEntries[bestMatchIndex];
          const entryA = JSON.stringify(playerA);
          const entryB = JSON.stringify(playerB);

          await redisClient.lRem(this.queueKey, 0, entryA);
          await redisClient.lRem(this.queueKey, 0, entryB);

          const players = Math.random() < 0.5
            ? { white: playerA, black: playerB }
            : { white: playerB, black: playerA };

          return {
            gameId: this.generateGameId(),
            players,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for match:', error);
      return null;
    }
  }

  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getQueueStats() {
    try {
      const queueEntries = (await redisClient.lRange(this.queueKey, 0, -1))
        .map((entry) => {
          try {
            return JSON.parse(entry);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const maleCount = queueEntries.filter((entry) => entry.selfGender === 'male').length;
      const femaleCount = queueEntries.filter((entry) => entry.selfGender === 'female').length;

      return {
        male: maleCount,
        female: femaleCount,
        total: queueEntries.length
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { male: 0, female: 0, total: 0 };
    }
  }
}

module.exports = new MatchmakingService();
