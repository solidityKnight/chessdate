'use strict';

/**
 * AIChatService — Generates chat responses using free AI APIs.
 * 
 * Priority: Gemini API → OpenRouter → HuggingFace → Fallback local responses
 * 
 * Configure via environment variables:
 *   AI_PROVIDER=gemini|openrouter|huggingface
 *   AI_API_KEY=<your-free-api-key>
 */

const fs = require('fs');
const path = require('path');
const settingsService = require('./SettingsService');

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const AI_API_KEY  = process.env.AI_API_KEY  || '';

// ─── Bot Names Loading ──────────────────────────────────────────────────────

let botNames = { male: [], female: [] };
try {
  const namesPath = path.join(__dirname, '..', '..', 'chessdate_names_1000.txt');
  if (fs.existsSync(namesPath)) {
    const raw = fs.readFileSync(namesPath, 'utf8');
    // The format is "Name - Gender Name - Gender ..."
    // Split by whitespace and parse
    const tokens = raw.split(/\s+/).filter(t => t.length > 0);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i + 1] === '-' && tokens[i + 2]) {
        const name = tokens[i];
        const gender = tokens[i + 2].toLowerCase();
        if (gender === 'male' || gender === 'male' || gender.startsWith('male')) {
          botNames.male.push(name);
        } else if (gender === 'female' || gender.startsWith('female')) {
          botNames.female.push(name);
        }
        i += 2; // skip past "- Gender"
      }
    }
    console.log(`Loaded bot names: ${botNames.male.length} male, ${botNames.female.length} female`);
  }
} catch (err) {
  console.error('Error loading bot names:', err);
}

function getRandomName(gender) {
  const list = gender === 'female' ? botNames.female : botNames.male;
  if (!list || list.length === 0) return gender === 'female' ? 'Emma' : 'Aarav';
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Fallback (no API) ───────────────────────────────────────────────────

class AIChatService {

  /**
   * Generate a chat response using the configured AI provider.
   * Falls back to local responses if the API call fails.
   *
   * @param {string} rawPrompt - The prompt description
   * @param {object} context   - { botGender, botName, playerMove, gameState }
   * @returns {Promise<string>} - Short chat message
   */
  async generateResponse(rawPrompt, context = {}) {
    // Check if bots are enabled
    if (!settingsService.areBotsEnabled()) return null;

    const { botName, botGender } = context;
    const name = botName || 'Aarav';

    // Refined prompt to strongly enforce identity and personality
    const prompt = `You are ${name}, a ${botGender || 'male'} chess player on ChessDate.
Current Task: ${rawPrompt}

Instructions:
1. You MUST identify as ${name}. If asked "who are you" or "what is your name", say "i'm ${name}" with personality flair.
2. Keep replies conversational: 10-25 words (1-2 short sentences)
3. Use lowercase and casual texting style (u, r, lol, etc.) naturally
4. Match your opponent's tone - be flirty if they are, competitive if they trash talk, etc.
5. NO quotes around your response.
6. Be specific - reference what they actually said or the actual game situation.

Reply as ${name}:`;

    if (!AI_API_KEY) {
      return this._fallbackResponse(prompt);
    }

    try {
      switch (AI_PROVIDER) {
        case 'gemini':
          return await this._geminiRequest(prompt);
        case 'openrouter':
          return await this._openRouterRequest(prompt);
        case 'huggingface':
          return await this._huggingFaceRequest(prompt);
        default:
          return await this._geminiRequest(prompt);
      }
    } catch (err) {
      console.error(`AI chat error (${AI_PROVIDER}):`, err.message);
      return this._fallbackResponse(prompt);
    }
  }

  // ─── Gemini API ──────────────────────────────────────────────────────────

  async _geminiRequest(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 60,
        temperature: 0.9,
        topP: 0.95,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this._sanitize(text);
  }

  // ─── OpenRouter API ──────────────────────────────────────────────────────

  async _openRouterRequest(prompt) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const body = {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.9,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return this._sanitize(text);
  }

  // ─── HuggingFace Inference API ───────────────────────────────────────────

  async _huggingFaceRequest(prompt) {
    const url = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!res.ok) {
      throw new Error(`HuggingFace error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.[0]?.generated_text || data?.generated_text || '';
    return this._sanitize(text);
  }

  // ─── Fallback (no API) ───────────────────────────────────────────────────

  /**
   * Generate contextual fallback responses based on the prompt content.
   * Uses regex to detect context and returns personality-appropriate messages.
   *
   * @param {string} prompt - The full prompt text
   * @returns {string} contextual response
   */
  _fallbackResponse(prompt) {
    const promptLower = prompt.toLowerCase();

    // Extract personality from prompt
    let personality = 'friendly';
    if (/flirty|lustful/i.test(prompt)) personality = 'flirty';
    else if (/trash_talk|arrogant/i.test(prompt)) personality = 'competitive';
    else if (/shy/i.test(prompt)) personality = 'shy';
    else if (/romantic/i.test(prompt)) personality = 'romantic';
    else if (/teasing/i.test(prompt)) personality = 'playful';
    else if (/cold/i.test(prompt)) personality = 'cold';
    else if (/competitive/i.test(prompt)) personality = 'competitive';

    // Detect context from prompt
    const isGreeting = /greeting|just started|game start/i.test(promptLower);
    const isReply = /opponent said|reply naturally/i.test(promptLower);
    const isReaction = /react to the chess|react to the move/i.test(promptLower);
    const isBlunder = /blunder|mistake|weak move/i.test(promptLower);
    const isStrongMove = /strong move|played well|great move/i.test(promptLower);
    const isInstagram = /instagram|insta|social/i.test(promptLower);
    const isWinning = /winning the game/i.test(promptLower);
    const isLosing = /losing the game/i.test(promptLower);
    const isFlirty = /flirty|flirt back|flirtatious/i.test(promptLower);
    const isTrashTalk = /trash talk|trash talking|competitive wit/i.test(promptLower);

    // Contextual responses by personality
    const responses = {
      greeting: {
        friendly: ["hey there! good luck 😊", "hi! ready to play? 🙌", "hello! let's have fun 💪"],
        flirty: ["hey handsome 😏 ready to lose?", "hi there 😉 looking forward to this", "hello! you're cute when you concentrate 😘"],
        competitive: ["let's go! i'm winning this 🏆", "ready to get crushed? 😤", "game on! prepare yourself 💪"],
        shy: ["h-hi... good luck... 🙈", "um... hello... 😳", "hi... i hope i do okay..."],
        romantic: ["a new match... how romantic 🌹", "shall we dance across the board? 💕", "fate brought us here together ✨"],
        playful: ["hey! don't go easy on me 😜", "ready to have some fun? 🤭", "let's see what you've got! 😝"],
        cold: ["let's get this over with", "fine. your move.", "whatever."],
      },
      reply: {
        friendly: ["that's nice of you to say 😊", "aww thanks! you're sweet 🙌", "haha you're funny! 💪"],
        flirty: ["you're making me blush 😳", "oh stop it, you're too much 😉", "you're pretty charming yourself 💋"],
        competitive: ["save the talk for after i win 😎", "flattery won't help you 😤", "is that your strategy? talking? 🏆"],
        shy: ["th-thanks... 🙈", "um... you too... 😳", "that's... nice of you..."],
        romantic: ["you have such a way with words 💕", "how poetic... i'm swooning 🌹", "you're quite the charmer ✨"],
        playful: ["oh really? prove it then 😜", "is that so? we'll see 🤭", "talk is cheap! show me 😝"],
        cold: ["whatever you say", "if you say so.", "moving on."],
      },
      reaction: {
        friendly: ["nice move! this is getting good 😊", "wow you're pretty good! 🙌", "good one! i see you 💪"],
        flirty: ["mmm that was hot 😏", "i like a player with skills 😉", "you're impressing me 💋"],
        competitive: ["not bad... but watch this 😤", "is that your best? 🏆", "i've seen better 💪"],
        shy: ["that was... really good... 🙈", "wow... you're strong...", "um... nice move... 😳"],
        romantic: ["such grace on the board 🌹", "you move like poetry 💕", "a beautiful attack ✨"],
        playful: ["oh playing hard to get? 😜", "trying to impress me? 🤭", "not bad, not bad 😝"],
        cold: ["fine.", "whatever.", "your move."],
      },
      blunder: {
        friendly: ["oops! happens to everyone 😅", "that was rough... want a redo? 😊", "hey we all make mistakes! 🙌"],
        flirty: ["aww that was cute 😏 almost got me", "is that your strategy? being adorable? 😉", "you're distracting me too much 💋"],
        competitive: ["seriously? that was weak 😤", "is this a joke? 🏆", "i expected better 💪"],
        shy: ["um... that wasn't... great... 🙈", "oh... i saw that... 😳", "maybe... try again?"],
        romantic: ["even mistakes can be beautiful 🌹", "the heart wants what it wants 💕", "love is blind... to blunders ✨"],
        playful: ["yikes! that was rough 😜", "did you just...? haha 🤭", "that was... interesting 😝"],
        cold: ["pathetic.", "really?", "ugh."],
      },
      strongMove: {
        friendly: ["whoa! great move! 😊", "that was really good! 🙌", "impressive! you're strong 💪"],
        flirty: ["that was sexy 😏 you're good", "mmm i like a player with skills 😉", "you're turning me on with that 💋"],
        competitive: ["fine... that was decent 😤", "ok ok you're not terrible 🏆", "i'll give you that one 💪"],
        shy: ["wow... that's scary good... 🙈", "you're... really strong... 😳", "i'm getting nervous..."],
        romantic: ["such mastery 🌹 i'm captivated", "you play like a grandmaster 💕", "brilliant! simply brilliant ✨"],
        playful: ["oh trying to show off? 😜", "flex on me why don't you 🤭", "someone's showing off 😝"],
        cold: ["fine.", "whatever.", "your move."],
      },
      instagram: {
        friendly: ["hey what's your insta? 😊", "do you have instagram? 🙌", "we should follow each other 💪"],
        flirty: ["you're cute... what's your insta? 😏", "wanna keep talking on insta? 😉", "i need to see more of you 💋"],
        competitive: ["what's your handle? i'll dm you when i win 😤", "insta? so i can tag you in my victory post 🏆", "give me your ig 💪"],
        shy: ["um... do you have... insta? 🙈", "maybe... we could... follow? 😳", "i'd like to... talk more..."],
        romantic: ["shall we continue this elsewhere? 🌹", "may i have your instagram? 💕", "i'd love to see your world ✨"],
        playful: ["hey drop your insta! 😜", "what's your handle? spill! 🤭", "insta? so i can stalk you 😝"],
        cold: ["your insta?", "instagram?", "handle?"],
      },
      winning: {
        friendly: ["this is going well! 😊", "i think i got this! 🙌", "feeling good about this 💪"],
        flirty: ["i'm winning and you're still cute 😏", "looks like i'm beating you... want a date to make up for it? 😉", "winning is sweet but you're sweeter 💋"],
        competitive: ["i'm crushing you 😤", "this is too easy 🏆", "give up already 💪"],
        shy: ["um... i'm ahead... 🙈", "i think... i'm winning... 😳", "this is... surprising..."],
        romantic: ["victory is within reach... like your heart 🌹", "i'm winning... shall we celebrate? 💕", "the board favors the brave ✨"],
        playful: ["i'm winning! admit it! 😜", "say i'm better! say it! 🤭", "victory is mine! 😝"],
        cold: ["i'm winning.", "you're losing.", "obvious."],
      },
      losing: {
        friendly: ["wow you're good! 😊", "this is tough but fun! 🙌", "you're strong! 💪"],
        flirty: ["you're beating me and it's hot 😏", "i like a dominant player 😉", "conquer me on the board 💋"],
        competitive: ["this isn't over 😤", "lucky moves won't save you 🏆", "i'm just getting started 💪"],
        shy: ["um... you're really good... 🙈", "i'm... struggling... 😳", "this is... hard..."],
        romantic: ["you've captured my heart... and my pieces 🌹", "defeat is bitter but you're sweet 💕", "a tragic romance on the board ✨"],
        playful: ["ok ok you got me there 😜", "you're showing off now 🤭", "i demand a rematch! 😝"],
        cold: ["whatever.", "fine.", "ugh."],
      },
      flirty: {
        friendly: ["you're so sweet! 😊", "aww you're making me smile 🙌", "you're really nice 💪"],
        flirty: ["you're making me blush 😏", "keep talking like that 😉", "i like where this is going 💋"],
        competitive: ["is flirting your strategy? 😤", "don't try to distract me 🏆", "save it for after i win 💪"],
        shy: ["oh... um... thanks... 🙈", "i'm... blushing... 😳", "that's... forward..."],
        romantic: ["my heart flutters 🌹", "you speak to my soul 💕", "such sweet words ✨"],
        playful: ["smooth! very smooth 😜", "someone's flirting! 🤭", "are you always this charming? 😝"],
        cold: ["whatever.", "if you say so.", "moving on."],
      },
      trashTalk: {
        friendly: ["hey that's not nice! 😅", "let's keep it friendly! 😊", "play nice! 🙌"],
        flirty: ["ooh feisty! i like it 😏", "is that your best trash talk? 😉", "trash talk me more 💋"],
        competitive: ["oh it's on now! 😤", "you asked for this! 🏆", "i'm gonna destroy you 💪"],
        shy: ["um... that was mean... 🙈", "why are you... being rude? 😳", "that hurt..."],
        romantic: ["love and war... 🌹", "such passion in your words 💕", "even your insults are poetic ✨"],
        playful: ["oh you want to go there? 😜", "game on trash talker! 🤭", "bring it! 😝"],
        cold: ["immature.", "whatever.", "boring."],
      },
    };

    // Select context
    let context = 'reply';
    if (isGreeting) context = 'greeting';
    else if (isBlunder) context = 'blunder';
    else if (isStrongMove) context = 'strongMove';
    else if (isInstagram) context = 'instagram';
    else if (isWinning) context = 'winning';
    else if (isLosing) context = 'losing';
    else if (isFlirty) context = 'flirty';
    else if (isTrashTalk) context = 'trashTalk';
    else if (isReaction) context = 'reaction';

    // Get responses for this context and personality
    const contextResponses = responses[context] || responses.reply;
    const personalityResponses = contextResponses[personality] || contextResponses.friendly;

    // Return random response
    return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
  }

  /**
   * Assign a name for a new match.
   */
  assignBotName(gender) {
    return getRandomName(gender);
  }

  // ─── Sanitize AI output ──────────────────────────────────────────────────

  _sanitize(text) {
    // Trim, take first line, limit to ~120 chars (for 10-25 words)
    let clean = text.trim().split('\n')[0].trim();

    // Remove quotes if the AI wrapped the response
    clean = clean.replace(/^["']|["']$/g, '');

    // Limit length — we want short but conversational chat messages
    if (clean.length > 120) {
      clean = clean.substring(0, 120).trim();
    }

    return clean || 'hmm';
  }
}

module.exports = new AIChatService();
