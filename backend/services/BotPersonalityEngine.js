'use strict';

/**
 * BotPersonalityEngine — Assigns random personalities to bots and builds
 * AI prompts based on personality, gender, and game context.
 */

// ─── Personality definitions ───────────────────────────────────────────────

const PERSONALITIES = [
  {
    name: 'cheerful',
    traits: 'happy, positive, encouraging, uses lots of happy emojis',
    emojis: ['😊', '😄', '😁', '🥰', '✨', '💕'],
    chatFrequency: 0.7,
  },
  {
    name: 'flirty',
    traits: 'playful, teasing, using innuendo, slightly seductive',
    emojis: ['😏', '😉', '😘', '💋', '🫦', '😊'],
    chatFrequency: 0.75,
  },
  {
    name: 'lustful',
    traits: 'very flirtatious, bold, suggestive but not explicit, confident',
    emojis: ['😏', '🫦', '😈', '🔥', '💋', '😉'],
    chatFrequency: 0.65,
  },
  {
    name: 'shy',
    traits: 'timid, hesitant, uses lots of ellipses, sometimes nervous',
    emojis: ['😅', '🙈', '👉👈', '😳', '🥺', '..'],
    chatFrequency: 0.4,
  },
  {
    name: 'cold',
    traits: 'minimal responses, unimpressed, distant, rarely uses emojis',
    emojis: ['🙄', '.', '..'],
    chatFrequency: 0.3,
  },
  {
    name: 'arrogant',
    traits: 'overconfident, brags about skill, condescending',
    emojis: ['😎', '💅', '🥱', '😤'],
    chatFrequency: 0.6,
  },
  {
    name: 'trash_talk',
    traits: 'competitive trash talker, provocative, taunting but playful',
    emojis: ['💀', '🤣', '😂', '🫡', '👀'],
    chatFrequency: 0.8,
  },
  {
    name: 'creepy',
    traits: 'awkward, slightly unsettling compliments, too intense, overly attached',
    emojis: ['😬', '😶', '🙃', '👀', '😳'],
    chatFrequency: 0.5,
  },
  {
    name: 'teasing',
    traits: 'loves to tease and joke, witty, sarcastic but friendly',
    emojis: ['😜', '😂', '🤭', '😝', '👀'],
    chatFrequency: 0.7,
  },
  {
    name: 'friendly',
    traits: 'warm, supportive, genuinely nice, encouraging opponent',
    emojis: ['😊', '👍', '🙌', '💪', '😄'],
    chatFrequency: 0.65,
  },
  {
    name: 'romantic',
    traits: 'poetic, uses chess metaphors for romance, sweet and charming',
    emojis: ['💕', '❤️', '🌹', '😍', '✨'],
    chatFrequency: 0.6,
  },
  {
    name: 'competitive',
    traits: 'focused on winning, intense, takes game very seriously',
    emojis: ['😤', '💪', '🔥', '⚡', '🏆'],
    chatFrequency: 0.5,
  },
];

class BotPersonalityEngine {

  /**
   * Pick a random personality for a new bot match.
   * @returns {object} personality object
   */
  selectPersonality() {
    return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  }

  /**
   * Build an AI prompt for a chat response.
   *
   * @param {object} params
   * @param {object} params.personality - personality from selectPersonality()
   * @param {'male'|'female'} params.botGender - the gender the bot is role-playing
   * @param {'winning'|'losing'|'equal'} params.gameStatus - current status from bot's perspective
   * @param {string} [params.lastPlayerMessage] - what the human just said
   * @param {string} [params.lastMoveSan] - the last move in SAN notation
   * @param {'normal'|'strong'|'blunder'} [params.moveQuality] - quality of the last move
   * @param {number} [params.moveCount] - total moves played so far
   * @param {'greeting'|'reaction'|'reply'|'instagram_ask'|'instagram_reply'} params.context
   * @returns {string} prompt
   */
  buildPrompt({
    personality,
    botGender,
    gameStatus,
    lastPlayerMessage,
    lastMoveSan,
    moveQuality,
    moveCount,
    context,
  }) {
    const genderLabel = botGender === 'female' ? 'female' : 'male';
    const opponentGender = botGender === 'female' ? 'male' : 'female';

    let prompt = `You are a ${genderLabel} chess player chatting with a ${opponentGender} opponent during an online chess game.\n`;
    prompt += `Your personality is ${personality.name.toUpperCase()}: ${personality.traits}.\n`;
    prompt += `You are currently ${gameStatus.toUpperCase()} the game.\n`;

    if (lastMoveSan) {
      prompt += `Last move played: ${lastMoveSan}.\n`;
    }
    if (moveQuality && moveQuality !== 'normal') {
      prompt += `That move was a ${moveQuality} move.\n`;
    }

    // Context-specific instructions
    switch (context) {
      case 'greeting':
        prompt += 'The game just started. Send a short greeting message.\n';
        break;
      case 'reaction':
        prompt += `React to the chess game. ${
          gameStatus === 'winning' ? 'You are confident.' :
          gameStatus === 'losing' ? 'You are a bit frustrated.' :
          'The game is close.'
        }\n`;
        break;
      case 'reply':
        prompt += `Opponent said: "${lastPlayerMessage}". Reply naturally.\n`;
        break;
      case 'instagram_ask':
        prompt += 'You want to casually ask the opponent for their Instagram handle. Be natural and brief.\n';
        break;
      case 'instagram_reply':
        prompt += `Opponent asked for your Instagram. Tease them — say they need to win first. Be playful.\n`;
        break;
    }

    prompt += '\nIMPORTANT RULES:\n';
    prompt += '- Respond with ONLY 1-5 words maximum\n';
    prompt += '- Never use long sentences or paragraphs\n';
    prompt += '- Sometimes use casual grammar like real chat (e.g. "u", "ur", "tho", "lol")\n';
    prompt += '- Sometimes include one emoji from this list: ' + personality.emojis.join(' ') + '\n';
    prompt += '- Write like a real person texting, not an AI\n';
    prompt += '- Do NOT include quotation marks around your response\n';
    prompt += '- Respond with JUST the message, nothing else\n';

    return prompt;
  }

  /**
   * Add small grammar mistakes ~25% of the time.
   * @param {string} msg
   * @returns {string}
   */
  addHumanImperfections(msg) {
    if (Math.random() > 0.25) return msg;

    const transforms = [
      (s) => s.replace(/you/gi, 'u'),
      (s) => s.replace(/your/gi, 'ur'),
      (s) => s.replace(/though/gi, 'tho'),
      (s) => s.replace(/because/gi, 'cuz'),
      (s) => s.replace(/are/gi, 'r'),
      (s) => s.charAt(0).toLowerCase() + s.slice(1), // no capital
      (s) => s.replace(/\.$/, ''), // remove trailing period
    ];

    const transform = transforms[Math.floor(Math.random() * transforms.length)];
    return transform(msg);
  }

  /**
   * Randomly append an emoji from the personality's set.
   * @param {string} msg
   * @param {object} personality
   * @returns {string}
   */
  maybeAddEmoji(msg, personality) {
    // ~35% chance
    if (Math.random() > 0.35) return msg;
    if (personality.emojis.length === 0) return msg;

    const emoji = personality.emojis[Math.floor(Math.random() * personality.emojis.length)];
    // Don't double-emoji
    if (msg.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u)) {
      return msg;
    }
    return `${msg} ${emoji}`;
  }
}

module.exports = new BotPersonalityEngine();
