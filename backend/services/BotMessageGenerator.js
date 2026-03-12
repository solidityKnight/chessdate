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
  initSession(gameId, { botGender, botColor, botSocketId, humanSocketId }) {
    const personality = personalityEngine.selectPersonality();
    
    const session = {
      personality,
      botGender,
      botColor,
      botSocketId,
      humanSocketId,
      moveCount: 0,
      instagramAsked: false,
      pendingTimers: new Set(),
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
   * Decides whether to reply or ignore.
   */
  async onPlayerMessage(gameId, io, playerMessage) {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // 40% chance to ignore
    if (Math.random() < 0.40) {
      console.log(`💬 Bot ignoring message in game ${gameId}`);
      return;
    }

    // Check if player is asking for instagram
    const lower = playerMessage.toLowerCase();
    const isInstaQuestion = lower.includes('insta') || lower.includes('instagram') || lower.includes('ig');

    const context = isInstaQuestion ? 'instagram_reply' : 'reply';

    // Delay 5-9 seconds with typing indicator
    const delay = 5000 + Math.random() * 4000;
    this._scheduleWithTyping(gameId, io, delay, async () => {
      await this._sendBotMessage(gameId, io, context, { lastPlayerMessage: playerMessage });
    });
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

    // Build AI prompt
    const prompt = personalityEngine.buildPrompt({
      personality: session.personality,
      botGender: session.botGender,
      gameStatus,
      lastPlayerMessage: extra.lastPlayerMessage || null,
      lastMoveSan: extra.lastMoveSan || null,
      moveQuality: extra.moveQuality || 'normal',
      moveCount: session.moveCount,
      context,
    });

    // Get AI response (or fallback)
    let message = await aiChatService.generateResponse(prompt);

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
