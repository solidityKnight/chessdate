const { User } = require('../models');

/**
 * Regenerates credits for a user based on time elapsed.
 * +1 credit every 6 hours, up to max of 5.
 * 
 * @param {User} user - The user instance from Sequelize
 * @returns {Promise<User>} - The updated user instance
 */
exports.regenerateCredits = async (user) => {
  if (user.credits >= 5) {
    user.lastCreditRegen = new Date();
    await user.save();
    return user;
  }

  return user;
};

/**
 * Checks if a user has enough credits to play.
 * If credits are 0, they cannot play.
 * Each credit allows 5 games.
 * 
 * @param {User} user - The user instance
 * @returns {boolean}
 */
exports.canPlay = (user) => {
  return user.credits > 0 || user.gamesPlayedInCredit < 5;
};

/**
 * Deducts game progress from credits.
 * 
 * @param {User} user - The user instance
 */
exports.deductGame = async (user) => {
  user.gamesPlayedInCredit += 1;
  
  if (user.gamesPlayedInCredit >= 5) {
    user.credits = Math.max(0, user.credits - 1);
    user.gamesPlayedInCredit = 0;
  }
  
  await user.save();
};
