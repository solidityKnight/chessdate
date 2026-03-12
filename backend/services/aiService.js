const aiChatService = require('./AIChatService');

/**
 * Generates a fun AI chess-themed pick-up line.
 * Uses Gemini AI to generate a fresh, unique line every time.
 * 
 * @returns {Promise<string>} - The generated pick-up line
 */
exports.generateChessPickUpLine = async () => {
  try {
    const prompt = "Generate a single, short, flirty, chess-themed pick-up line. Be creative and funny. Under 15 words.";
    const response = await aiChatService.generateResponse(prompt, { 
      botName: 'ChessDate', 
      botGender: 'neutral' 
    });
    
    return response || "Are you a queen? Because you've been running through my mind all game.";
  } catch (error) {
    console.error('AI Pick-up Line Generation Error:', error);
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
