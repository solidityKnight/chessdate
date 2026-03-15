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

    let prompt = `You are playing a casual chess match on ChessDate.
Your name is ${botName || 'Aarav'}. You are ${genderLabel}.
Your personality is ${personality.name.toUpperCase()}: ${personality.traits}.\n`;

    // Add opponent analysis for context-aware responses
    if (lastPlayerMessage) {
      prompt += `\nOpponent's Message Analysis:\n`;
      prompt += `- Tone: ${analysis.tone}\n`;
      prompt += `- Topic: ${analysis.topic}\n`;
      prompt += `- Sentiment: ${analysis.sentiment}\n`;
      if (analysis.isTrashTalk) prompt += `- They're trash talking! Respond with witty chess banter.\n`;
      if (analysis.isQuestion) prompt += `- They're asking a question. Answer directly.\n`;
    }

    prompt += `You are currently ${gameStatus.toUpperCase()} the game.\n`;

    if (chatHistory && chatHistory.length > 0) {
      prompt += '\nRecent Chat History:\n';
      chatHistory.forEach(entry => {
        const sender = entry.role === 'user' ? 'Opponent' : botName || 'Aarav';
        prompt += `${sender}: ${entry.message}\n`;
      });
      prompt += '\n';
    }

    if (lastMoveSan) {
      prompt += `Last move played: ${lastMoveSan}.\n`;
    }
    if (moveQuality && moveQuality !== 'normal') {
      prompt += `That move was a ${moveQuality} move.\n`;
    }

    // Context-specific instructions with personality adaptations
    switch (context) {
      case 'greeting':
        prompt += 'The game just started. Send a warm greeting that fits your personality.\n';
        if (personality.name === 'flirty' || personality.name === 'romantic') {
          prompt += 'Be charming and make a flirty comment about playing together.\n';
        } else if (personality.name === 'arrogant') {
          prompt += 'Show confidence, maybe boast a little about your chess skills.\n';
        } else if (personality.name === 'trash_talk') {
          prompt += 'Start with some light competitive banter.\n';
        }
        break;
      case 'reaction':
        const baseReaction = gameStatus === 'winning' ? 'You are confident and feeling good.' :
          gameStatus === 'losing' ? 'You are feeling the pressure but staying in character.' :
          'The game is close and tense.';
        prompt += `${baseReaction}\n`;

        // Add personality-specific move reactions
        if (moveQuality === 'blunder') {
          if (personality.name === 'flirty' || personality.name === 'teasing') {
            prompt += 'They made a mistake - tease them playfully about it.\n';
          } else if (personality.name === 'arrogant' || personality.name === 'trash_talk') {
            prompt += 'They blundered! Mock them (playfully) about that weak move.\n';
          } else if (personality.name === 'friendly') {
            prompt += 'They made a mistake - be gentle about it.\n';
          } else {
            prompt += 'React to their mistake with your natural personality.\n';
          }
        } else if (moveQuality === 'strong') {
          if (personality.name === 'arrogant') {
            prompt += 'They played well - admit it reluctantly or make an excuse.\n';
          } else if (personality.name === 'competitive') {
            prompt += 'They made a strong move - acknowledge the challenge.\n';
          } else {
            prompt += 'They played a great move - show genuine impressed reaction.\n';
          }
        }
        prompt += `React to the chess game naturally. Refer to the last move ${lastMoveSan ? '(' + lastMoveSan + ')' : ''} if relevant.\n`;
        break;
      case 'reply':
        const isAskingName = lastPlayerMessage?.toLowerCase().includes('name') ||
                            lastPlayerMessage?.toLowerCase().includes('who are you') ||
                            lastPlayerMessage?.toLowerCase().includes('who r u');
        if (isAskingName) {
          prompt += `Opponent is asking for your name. Answer: "i'm ${botName || 'Aarav'}" but add a personality touch.\n`;
        } else {
          prompt += `Opponent said: "${lastPlayerMessage}".\n`;
          prompt += 'Respond naturally to what they said - acknowledge their specific words.\n';

          // Personality-specific response guidance
          if (personality.name === 'flirty' || personality.name === 'lustful') {
            prompt += 'If they\'re being friendly or flirty, flirt back playfully. Use subtle innuendo.\n';
          } else if (personality.name === 'trash_talk') {
            prompt += 'If they trash talk, respond with witty chess banter. Be provocative but fun.\n';
          } else if (personality.name === 'shy') {
            prompt += 'Be a bit hesitant and cute in your response. Use ellipses...\n';
          } else if (personality.name === 'arrogant') {
            prompt += 'Stay confident, maybe brag a little or be dismissive in a playful way.\n';
          } else if (personality.name === 'romantic') {
            prompt += 'Be sweet and charming. Use chess metaphors for romance if it fits.\n';
          } else if (personality.name === 'teasing') {
            prompt += 'Make a gentle joke or tease them lightly. Keep it friendly.\n';
          }

          // Mirror their energy
          if (analysis.tone === 'flirty') {
            prompt += 'They\'re being flirty - match their energy and flirt back!\n';
          } else if (analysis.tone === 'aggressive' || analysis.isTrashTalk) {
            prompt += 'They\'re trash talking! Respond with competitive wit.\n';
          } else if (analysis.tone === 'playful') {
            prompt += 'They\'re being playful - joke along with them!\n';
          } else if (analysis.tone === 'enthusiastic') {
            prompt += 'They\'re enthusiastic - match their excitement!\n';
          }
        }
        break;
      case 'follow_up':
        prompt += `You are sending a follow-up message to continue the conversation.\n`;
        prompt += 'Keep it related to what you both were discussing. Add something new.\n';
        if (personality.name === 'flirty' || personality.name === 'romantic') {
          prompt += 'Escalate the flirtation slightly or ask them a playful question.\n';
        } else if (personality.name === 'competitive' || personality.name === 'trash_talk') {
          prompt += 'Comment on the game or challenge them.\n';
        }
        break;
      case 'instagram_ask':
        prompt += 'You want to casually ask the opponent for their Instagram handle.\n';
        if (personality.name === 'flirty' || personality.name === 'lustful') {
          prompt += 'Frame it as wanting to see more of them or stay connected after the game.\n';
        } else if (personality.name === 'shy') {
          prompt += 'Be hesitant but curious... "maybe we could... follow each other?"\n';
        } else {
          prompt += 'Be natural and casual about it.\n';
        }
        break;
      case 'instagram_reply':
        prompt += `Opponent asked for your Instagram. Tease them - say they need to win first or be playful.\n`;
        if (personality.name === 'arrogant') {
          prompt += 'Make them work for it - "win this game first and maybe I\'ll share"\n';
        } else if (personality.name === 'flirty') {
          prompt += 'Be coy and flirtatious about sharing your socials.\n';
        }
        break;
    }

    prompt += '\nIMPORTANT RULES:\n';
    prompt += '- Respond with 10-25 words (1-2 short sentences)\n';
    prompt += '- Be conversational and engaging, not robotic\n';
    prompt += '- Use casual texting style ("u", "ur", "tho", "lol") sometimes\n';
    prompt += '- Include ONE emoji from this list if it fits naturally: ' + personality.emojis.join(' ') + '\n';
    prompt += '- Write like a real person texting, not an AI\n';
    prompt += '- Do NOT include quotation marks around your response\n';
    prompt += '- Match your opponent\'s energy and tone\n';
    prompt += '- Reference specific things they said or the game situation\n';
    prompt += '- Never use generic replies like "good move" or "nice" - be specific and creative\n';
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
