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

// ─── Fallback responses when no API is available ────────────────────────────

const FALLBACK_RESPONSES = {
  winning: [
    'gg', 'lol', 'nice try', 'this is over 😏', 'mate soon',
    'too easy', 'oof', 'rip', '💀', 'ez', 'haha', 'sry 😅',
  ],
  losing: [
    'ugh', 'wait what', 'bruh', 'ok nice', 'damn', 'how',
    'lucky move', '😤', 'fine', 'ughhh', 'ok that was good', 'nah',
  ],
  equal: [
    'hmm', 'interesting', 'ok', 'lets see', 'ur turn',
    'nice', '🤔', 'alright', 'go on', 'hmm ok', 'not bad',
  ],
  greeting: [
    'hey', 'hii', 'heyy', 'hihi', 'hi there', 'yo', 'heyyy',
    'hello!', 'sup', 'hiii',
  ],
  instagram: [
    'you got insta?', "what's your insta?", 'drop ur insta',
    'u on insta?', 'insta?',
  ],
  instagram_reply: [
    'maybe if you win 😏', 'beat me first', 'win and find out 😉',
    'lol maybe after the game', 'u gotta earn it 😏',
  ],
};

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

    const prompt = `You are playing a casual chess match on ChessDate. 
Your name is ${name}. You are ${botGender || 'male'}.
Rules: 
1. Keep replies VERY short (under 10 words).
2. Use lowercase and casual internet slang (hey, lol, u, r, etc.).
3. Be friendly but slightly flirty if appropriate.
4. If asked for your name, say "I'm ${name}".
Context: ${rawPrompt}
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
        maxOutputTokens: 30,
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
      max_tokens: 30,
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

  _fallbackResponse(prompt) {
    // Try to detect context from prompt keywords
    const lower = prompt.toLowerCase();

    let pool;
    if (lower.includes('winning')) {
      pool = FALLBACK_RESPONSES.winning;
    } else if (lower.includes('losing')) {
      pool = FALLBACK_RESPONSES.losing;
    } else if (lower.includes('greeting') || lower.includes('hello') || lower.includes('game just started')) {
      pool = FALLBACK_RESPONSES.greeting;
    } else if (lower.includes('instagram') || lower.includes('insta')) {
      pool = FALLBACK_RESPONSES.instagram_reply;
    } else {
      pool = FALLBACK_RESPONSES.equal;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get a random Instagram-related message (bot initiating).
   */
  getInstagramAsk() {
    const pool = FALLBACK_RESPONSES.instagram;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get a random Instagram reply (when player asks for bot's insta).
   */
  getInstagramReply() {
    const pool = FALLBACK_RESPONSES.instagram_reply;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Assign a name for a new match.
   */
  assignBotName(gender) {
    return getRandomName(gender);
  }

  // ─── Sanitize AI output ──────────────────────────────────────────────────

  _sanitize(text) {
    // Trim, take first line, limit to ~60 chars
    let clean = text.trim().split('\n')[0].trim();
    
    // Remove quotes if the AI wrapped the response
    clean = clean.replace(/^["']|["']$/g, '');
    
    // Limit length — we want short chat messages
    if (clean.length > 60) {
      clean = clean.substring(0, 60).trim();
    }
    
    return clean || 'hmm';
  }
}

module.exports = new AIChatService();
