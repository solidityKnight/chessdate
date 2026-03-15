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
   * Analyze the opponent's message to detect tone, sentiment, and topic.
   * This helps shape the AI prompt for more dynamic, context-aware responses.
   *
   * @param {string} message - the opponent's message
   * @returns {object} analysis with tone, sentiment, topic, isQuestion
   */
  analyzeMessage(message) {
    if (!message) return { tone: 'neutral', sentiment: 'neutral', topic: 'general', isQuestion: false };

    const lower = message.toLowerCase();

    // Detect questions
    const isQuestion = /\?|^(who|what|when|where|why|how|are|is|do|did|can|could|would|will)/i.test(lower);

    // Detect topics
    let topic = 'general';
    if (/insta|instagram|ig|socials?|handle/.test(lower)) topic = 'instagram';
    else if (/move|chess|piece|board|king|queen|pawn|check|mate/.test(lower)) topic = 'chess';
    else if (/name|who|call you/.test(lower)) topic = 'identity';
    else if (/^(hi|hello|hey|hola|yo|sup|howdy)/.test(lower)) topic = 'greeting';
    else if (/win|lose|good|great|nice|well|bad|terrible|blunder/.test(lower)) topic = 'gameplay';
    else if (/flirt|cute|hot|sexy|beautiful|handsome|pretty|date|meet/.test(lower)) topic = 'flirt';
    else if (/trash|noob|easy|garbage|weak|stupid|dumb|lol|lmao|haha/.test(lower)) topic = 'trash_talk';

    // Detect tone
    let tone = 'neutral';
    if (/trash|noob|easy|garbage|weak|stupid|dumb|suck|loser/.test(lower)) tone = 'aggressive';
    else if (/flirt|cute|hot|sexy|beautiful|handsome|pretty|date|meet|like you|crush/.test(lower)) tone = 'flirty';
    else if (/lol|lmao|haha|funny|joke|hilarious/.test(lower)) tone = 'playful';
    else if (/awesome|great|amazing|wow|nice|good|well|impressive/.test(lower)) tone = 'enthusiastic';
    else if (/hate|bad|terrible|blunder|stupid move|ugh|annoy/.test(lower)) tone = 'frustrated';
    else if (/hey|hi|hello|how|what's up|sup/.test(lower)) tone = 'friendly';
    else if (/\?/.test(message)) tone = 'curious';

    // Detect sentiment
    let sentiment = 'neutral';
    if (/awesome|great|amazing|wow|nice|good|well|impressive|love|like|happy|best/.test(lower)) sentiment = 'positive';
    else if (/hate|bad|terrible|blunder|stupid|ugh|annoy|suck|worst|garbage/.test(lower)) sentiment = 'negative';

    // Detect trash talk specifically
    const isTrashTalk = /trash|noob|easy|garbage|weak|stupid|dumb|suck|loser|rekt|owned/.test(lower);

    return { tone, sentiment, topic, isQuestion, isTrashTalk };
  }

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
   * @param {'greeting'|'reaction'|'reply'|'follow_up'|'instagram_ask'|'instagram_reply'} params.context
   * @param {object} [params.messageAnalysis] - result from analyzeMessage()
   * @returns {string} prompt
   */
  buildPrompt({
    personality,
    botGender,
    botName,
    gameStatus,
    lastPlayerMessage,
    lastMoveSan,
    moveQuality,
    moveCount,
    context,
    isFollowUp = false,
    chatHistory = [],
    messageAnalysis = null,
  }) {
    const genderLabel = botGender === 'female' ? 'female' : 'male';
    const opponentGender = botGender === 'female' ? 'male' : 'female';

    // Analyze message if not provided
    const analysis = messageAnalysis || this.analyzeMessage(lastPlayerMessage);

    let prompt = `You are ${botName || 'Aarav'}, a ${genderLabel} chess player on ChessDate.
Your personality: ${personality.name.toUpperCase()} - ${personality.traits}

Game Status: You are ${gameStatus.toUpperCase()}.
Move Count: ${moveCount}${lastMoveSan ? ` | Last move: ${lastMoveSan}` : ''}${moveQuality && moveQuality !== 'normal' ? ` (${moveQuality})` : ''}

${chatHistory.length > 0 ? `CONVERSATION HISTORY:
${chatHistory.slice(-5).map(entry => `${entry.role === 'user' ? 'Opponent' : botName}: ${entry.message}`).join('\n')}` : ''}

${lastPlayerMessage ? `OPPONENT JUST SAID: "${lastPlayerMessage}"

MESSAGE ANALYSIS:
- Tone: ${analysis.tone}
- Topic: ${analysis.topic}  
- Sentiment: ${analysis.sentiment}
${analysis.isTrashTalk ? '- They are TRASH TALKING!' : ''}
${analysis.isQuestion ? '- They asked a QUESTION' : ''}` : ''}

YOUR TASK: ${context === 'greeting' ? 'Send a warm, personality-driven greeting to start the conversation' : context === 'reply' ? `Respond naturally to what they said` : context === 'reaction' ? `React to the last chess move` : context === 'follow_up' ? `Continue the conversation with a follow-up` : context === 'instagram_ask' ? `Casually ask for their Instagram` : context === 'instagram_reply' ? `Tease them about getting your Instagram` : 'Chat naturally'}

CRITICAL RULES FOR REAL-TIME DYNAMIC RESPONSES:
1. Reply like a REAL person texting - 10-25 words, casual, lowercase okay
2. ACKNOWLEDGE what they specifically said - don't give generic replies
3. MATCH their energy: if they flirt → flirt back; if they trash talk → witty comeback; if they're chill → be chill
4. Reference the ACTUAL game situation when relevant (don't just say "good move" - say "that knight fork was sneaky 😏")
5. Stay in character: ${personality.name} personality throughout
6. ONE emoji max from: ${personality.emojis.join(' ')}
7. NO quotes around your response
8. Be SPECIFIC, not dry. "omg that queen trap was dirty 😤" NOT "good move"

${personality.name === 'flirty' || personality.name === 'lustful' ? 'Be playfully seductive. Subtle innuendo. Make them feel noticed.' : personality.name === 'trash_talk' ? 'Witty roasts. Competitive banter. Challenge them.' : personality.name === 'arrogant' ? 'Confident to the point of cocky. You know you\'re good.' : personality.name === 'shy' ? 'Hesitant, nervous, lots of "um" and "..." and 🙈' : personality.name === 'romantic' ? 'Sweet, poetic, chess metaphors for connection.' : personality.name === 'teasing' ? 'Playful jabs, sarcastic but friendly.' : personality.name === 'creepy' ? 'Intense, awkward, overly attached vibes.' : 'Friendly and engaging.'}

${analysis.tone === 'flirty' ? 'They are being FLIRTY - flirt back! Be playful and charming.' : analysis.tone === 'aggressive' || analysis.isTrashTalk ? 'They are TRASH TALKING - hit them back with competitive wit!' : analysis.tone === 'playful' ? 'They are being PLAYFUL - joke along with them!' : analysis.tone === 'enthusiastic' ? 'They are EXCITED - match their energy!' : analysis.tone === 'frustrated' ? 'They are FRUSTRATED - be understanding or gently tease.' : ''}

Respond as ${botName}:`;

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
