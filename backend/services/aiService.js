const aiChatService = require('./AIChatService');

/**
 * Generates a fun AI chess-themed pick-up line.
 * Uses a large local library of curated lines to ensure it's free and always works without a key.
 * 
 * @returns {Promise<string>} - The generated pick-up line
 */
exports.generateChessPickUpLine = async () => {
  const chessPickUpLines = [
    "Are you a queen? Because you've been running through my mind all game.",
    "I'm not a grandmaster, but I can see us having a great future together.",
    "Is your name Checkmate? Because you've got me trapped.",
    "Are we playing blitz? Because my heart is racing.",
    "You must be a passed pawn, because you've reached the end of my heart.",
    "I'd never resign if it meant spending more time with you.",
    "Are you a bishop? Because you've got me seeing things from a whole new angle.",
    "My feelings for you are like a knight move: unpredictable and always landing in the right spot.",
    "You're like a Sicilian Defense – complex, intriguing, and I want to study every move you make.",
    "I'm usually good at endgames, but with you, I never want this to end.",
    "Are you the center of the board? Because you're the most important thing I'm focused on.",
    "If you were a chess piece, you'd be a Queen – powerful, beautiful, and essential to my game.",
    "I'd sacrifice my rook just to get a chance to sit across from you.",
    "Is your rating 2800? Because you're definitely a super-GM in my eyes.",
    "You've got me in zugzwang – every move I make just makes me fall for you more.",
    "Our chemistry is better than a well-coordinated kingside attack.",
    "Are you a fianchettoed bishop? Because you're radiating power from across the room.",
    "I don't need a clock to know it's always the right time to talk to you.",
    "You must be an open file, because you've got a direct line to my heart.",
    "Are you a grandmaster? Because you've definitely mastered the art of stealing my heart.",
    "I'd play a thousand games just to win a single smile from you.",
    "You're the only mate I'm looking for in this game of life.",
    "Is it my turn? Because I'm ready to make a move on you.",
    "You're like a perfect opening – you've already won me over in the first few moves.",
    "I'm not playing for a draw; I'm playing to win your heart.",
    "Are you a castled king? Because you look safe and sound in my arms.",
    "You're the tactical masterpiece I've been waiting for my whole life.",
    "I'd trade my most valuable piece just for one date with you.",
    "Are you a promotion? Because you've turned my life into something much better.",
    "Every time I see you, my internal engine gives you a +10 evaluation."
  ];

  try {
    // Randomly select from our curated "free and public" library
    const randomIndex = Math.floor(Math.random() * chessPickUpLines.length);
    return chessPickUpLines[randomIndex];
  } catch (error) {
    console.error('Pick-up Line Selection Error:', error);
    return "Are you a queen? Because you've been running through my mind all game.";
  }
};

/**
 * Assign a bot name based on gender.
 * Delegates to AIChatService.
 * 
 * @param {string} gender 
 * @returns {string}
 */
exports.assignBotName = (gender) => {
  return aiChatService.assignBotName(gender);
};
