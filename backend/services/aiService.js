const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates a fun AI chess-themed pick-up line.
 * 
 * @returns {Promise<string>} - The generated pick-up line
 */
exports.generateChessPickUpLine = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackLines = [
        "Are you a queen? Because you've been running through my mind all game.",
        "I'm not a grandmaster, but I can see us having a great future together.",
        "Is your name Checkmate? Because you've got me trapped.",
        "Are we playing blitz? Because my heart is racing.",
        "You must be a passed pawn, because you've reached the end of my heart."
      ];
      return fallbackLines[Math.floor(Math.random() * fallbackLines.length)];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = "Generate a short, fun, flirty, chess-themed pick-up line for a chess dating app. It should be one sentence and clever. Examples: 'Are you a queen? Because you've been running through my mind all game', 'I'd never resign if it meant spending more time with you'.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('AI Pick-up Line Error:', error);
    return "Are you a queen? Because you've been running through my mind all game.";
  }
};
