class EloService {
  constructor() {
    this.K_FACTOR = 32;
  }

  /**
   * Calculate expected score
   * @param {number} ratingA - Rating of player A
   * @param {number} ratingB - Rating of player B
   * @returns {number} Expected score for player A
   */
  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calculate rating change
   * @param {number} currentRating - Current rating
   * @param {number} opponentRating - Opponent's rating
   * @param {number} actualScore - 1 for win, 0.5 for draw, 0 for loss
   * @returns {number} New rating
   */
  calculateNewRating(currentRating, opponentRating, actualScore) {
    const expectedScore = this.getExpectedScore(currentRating, opponentRating);
    const newRating = Math.round(currentRating + this.K_FACTOR * (actualScore - expectedScore));
    return newRating;
  }

  /**
   * Process game result and return rating changes for both players
   * @param {number} rating1 - Rating of player 1
   * @param {number} rating2 - Rating of player 2
   * @param {string} result - 'win', 'loss', or 'draw' for player 1
   * @returns {Object} { newRating1, newRating2, change1, change2 }
   */
  processGameResult(rating1, rating2, result) {
    let score1, score2;

    if (result === 'win') {
      score1 = 1;
      score2 = 0;
    } else if (result === 'loss') {
      score1 = 0;
      score2 = 1;
    } else {
      score1 = 0.5;
      score2 = 0.5;
    }

    const newRating1 = this.calculateNewRating(rating1, rating2, score1);
    const newRating2 = this.calculateNewRating(rating2, rating1, score2);

    return {
      newRating1,
      newRating2,
      change1: newRating1 - rating1,
      change2: newRating2 - rating2
    };
  }
}

module.exports = new EloService();
