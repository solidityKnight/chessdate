'use strict';

/**
 * BotMessageGenerator — Orchestrates the full bot chat experience:
 * timing delays, typing indicators, ignore probability, instagram asks,
 * and AI-powered response generation.
 */

const aiChatService       = require('./AIChatService');
const personalityEngine   = require('./BotPersonalityEngine');
const chessBotEngine      = require('./ChessBotEngine');

class BotMessageGenerator {
  constructor() {
    /**
     * Active bot chat sessions.
     * Key: gameId
     * Value: {
     *   personality: object,
     *   botGender: 'male'|'female',
     *   botColor: 'white'|'black',
     *   botSocketId: string,
     *   humanSocketId: string,
     *   moveCount: number,
     *   instagramAsked: boolean,
     *   pendingTimers: Set<NodeJS.Timeout>,
     * }
     */
    this.sessions = new Map();
  }

  /**
   * Initialize a chat session for a bot game.
   */
  initSession(gameId, { botGender, botName, botColor, botSocketId, humanSocketId }) {
    const personality = personalityEngine.selectPersonality();
    
    const session = {
      personality,
      botGender,
      botName,
      botColor,
      botSocketId,
      humanSocketId,
      moveCount: 0,
      instagramAsked: false,
      pendingTimers: new Set(),
      chatHistory: [], // Store chat history for context
    };

    this.sessions.set(gameId, session);
    console.log(`💬 Bot chat session: gameId=${gameId}, personality=${personality.name}, gender=${botGender}`);
    return session;
  }

  /**
   * Clean up a chat session.
   */
  destroySession(gameId) {
    const session = this.sessions.get(gameId);
    if (session) {
      for (const timer of session.pendingTimers) {
        clearTimeout(timer);
      }
      this.sessions.delete(gameId);
    }
  }

  /**
   * Send a greeting message shortly after the game starts.
   */
  scheduleGreeting(gameId, io) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // Delay 3-6 seconds after game start
    const delay = 3000 + Math.random() * 3000;
    const timer = setTimeout(async () => {
      session.pendingTimers.delete(timer);
      await this._sendBotMessage(gameId, io, 'greeting');
    }, delay);
    session.pendingTimers.add(timer);
  }

  /**
   * Called when the human player sends a chat message.
   * Always responds with personality-based engagement.
   */
  async onPlayerMessage(gameId, io, playerMessage) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // Add to history
    session.chatHistory.push({ role: 'user', message: playerMessage });
    if (session.chatHistory.length > 10) session.chatHistory.shift();

    // Analyze the opponent's message for tone and content
    const messageAnalysis = personalityEngine.analyzeMessage(playerMessage);

    // Check if player is asking for instagram
    const lower = playerMessage.toLowerCase();
    const isInstaQuestion = lower.includes('insta') || lower.includes('instagram') || lower.includes('ig');

    const context = isInstaQuestion ? 'instagram_reply' : 'reply';

    // Decide how many messages to send (1-3)
    // 60% chance for 1 message, 30% for 2, 10% for 3
    let numMessages = 1;
    const r = Math.random();
    if (r > 0.6 && r <= 0.9) numMessages = 2;
    else if (r > 0.9) numMessages = 3;

    let accumulatedDelay = 0;

    for (let i = 0; i < numMessages; i++) {
      // First message: 4-7 seconds. Subsequent messages: 3-5 seconds after the previous one.
      const stepDelay = i === 0 ? (4000 + Math.random() * 3000) : (3000 + Math.random() * 2000);
      accumulatedDelay += stepDelay;

      // We use a separate closure for each message to ensure the context is correct
      const isLast = (i === numMessages - 1);
      const messageContext = (i === 0) ? context : 'follow_up';

      this._scheduleWithTyping(gameId, io, accumulatedDelay, async () => {
        await this._sendBotMessage(gameId, io, messageContext, {
          lastPlayerMessage: playerMessage,
          isFollowUp: i > 0,
          messageAnalysis
        });
      });
    }
  }

  /**
   * Called after a move is made in a bot game.
   * May trigger a gameplay reaction or instagram ask.
   */
  onMoveMade(gameId, io, { fen, lastMoveSan, moveQuality }) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    session.moveCount++;

    // Chance to react to a move (~30% for most personalities, modified by chatFrequency)
    const shouldReact = Math.random() < (session.personality.chatFrequency * 0.4);

    if (shouldReact) {
      const delay = 5000 + Math.random() * 4000;
      this._scheduleWithTyping(gameId, io, delay, async () => {
        await this._sendBotMessage(gameId, io, 'reaction', {
          fen, lastMoveSan, moveQuality,
        });
      });
    }

    // Instagram ask: after 6-12 moves, once per game, ~25% chance per eligible move
    if (
      !session.instagramAsked &&
      session.moveCount >= 6 &&
      session.moveCount <= 12 &&
      Math.random() < 0.25
    ) {
      session.instagramAsked = true;
      const instaDelay = 8000 + Math.random() * 6000;
      this._scheduleWithTyping(gameId, io, instaDelay, async () => {
        await this._sendBotMessage(gameId, io, 'instagram_ask');
      });
    }
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  /**
   * Schedule a callback with a typing indicator emitted before execution.
   */
  _scheduleWithTyping(gameId, io, delayMs, callback) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // Emit typing indicator immediately
    io.to(session.humanSocketId).emit('opponent_typing', { gameId });

    const timer = setTimeout(async () => {
      session.pendingTimers.delete(timer);
      try {
        await callback();
      } catch (err) {
        console.error('Bot message callback error:', err);
      }
    }, delayMs);
    session.pendingTimers.add(timer);
  }

  /**
   * Generate and emit a bot chat message.
   */
  async _sendBotMessage(gameId, io, context, extra = {}) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    const gameStatus = extra.fen
      ? chessBotEngine.getGameStatus(extra.fen, session.botColor)
      : 'equal';

    // Build AI prompt with message analysis
    const prompt = personalityEngine.buildPrompt({
      personality: session.personality,
      botGender: session.botGender,
      botName: session.botName,
      gameStatus,
      lastPlayerMessage: extra.lastPlayerMessage || null,
      lastMoveSan: extra.lastMoveSan || null,
      moveQuality: extra.moveQuality || 'normal',
      moveCount: session.moveCount,
      context,
      isFollowUp: extra.isFollowUp || false,
      chatHistory: session.chatHistory,
      messageAnalysis: extra.messageAnalysis || null,
    });

    // Get AI response (or fallback)
    let message = await aiChatService.generateResponse(prompt, {
      botName: session.botName,
      botGender: session.botGender,
    });

    // Add bot's response to history
    session.chatHistory.push({ role: 'bot', message });
    if (session.chatHistory.length > 10) session.chatHistory.shift();

    // Apply human imperfections
    message = personalityEngine.addHumanImperfections(message);
    message = personalityEngine.maybeAddEmoji(message, session.personality);

    // Emit the chat message through the normal chat flow
    const chatMessage = {
      playerId: session.botSocketId,
      playerColor: session.botColor,
      message,
      timestamp: Date.now(),
    };

    io.to(session.humanSocketId).emit('chat_message', chatMessage);

    console.log(`💬 Bot (${session.personality.name}): "${message}" → game ${gameId}`);
  }
}

module.exports = new BotMessageGenerator();
