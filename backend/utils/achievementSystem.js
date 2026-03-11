const { User } = require('../models');

const ACHIEVEMENTS = {
  FIRST_CHECKMATE: {
    name: "First Checkmate ❤️",
    description: "Win your first game by checkmate"
  },
  TEN_WINS_STREAK: {
    name: "Won 10 games in a row",
    description: "Achieve a winning streak of 10 games"
  },
  SMOOTH_TALKER: {
    name: "Smooth Talker",
    description: "Send 100 total chat messages"
  }
};

/**
 * Checks and awards achievements to a user.
 * 
 * @param {User} user - The user instance
 * @param {string} type - The event type ('checkmate', 'win', 'message')
 * @returns {Promise<string[]>} - List of newly unlocked achievement names
 */
exports.checkAchievements = async (user, type) => {
  const newlyUnlocked = [];
  const existingNames = user.achievements.map(a => a.name);

  if (type === 'checkmate') {
    if (!existingNames.includes(ACHIEVEMENTS.FIRST_CHECKMATE.name)) {
      newlyUnlocked.push(ACHIEVEMENTS.FIRST_CHECKMATE);
    }
  }

  if (type === 'win') {
    if (user.winStreak >= 10 && !existingNames.includes(ACHIEVEMENTS.TEN_WINS_STREAK.name)) {
      newlyUnlocked.push(ACHIEVEMENTS.TEN_WINS_STREAK);
    }
  }

  if (user.totalMessages >= 100 && !existingNames.includes(ACHIEVEMENTS.SMOOTH_TALKER.name)) {
    newlyUnlocked.push(ACHIEVEMENTS.SMOOTH_TALKER);
  }

  if (newlyUnlocked.length > 0) {
    user.achievements = [...user.achievements, ...newlyUnlocked.map(a => ({
      ...a,
      unlockedAt: new Date()
    }))];
    await user.save();
  }

  return newlyUnlocked.map(a => a.name);
};

exports.ACHIEVEMENTS = ACHIEVEMENTS;
