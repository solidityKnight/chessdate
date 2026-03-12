'use strict';

/**
 * SettingsService — In-memory cached access to system_settings.
 * Loads on startup; updates cache when admin toggles settings.
 * Avoids DB queries on every move/matchmaking check.
 */

const SystemSettings = require('../models/SystemSettings');

class SettingsService {
  constructor() {
    /** @type {Map<string, string>} */
    this.cache = new Map();
    this._loaded = false;
  }

  /**
   * Load all settings from the database into cache.
   * Called once on server startup.
   */
  async loadAll() {
    try {
      const rows = await SystemSettings.findAll();
      for (const row of rows) {
        this.cache.set(row.key, row.value);
      }

      // Ensure AI_BOTS_ENABLED exists with default 'true'
      if (!this.cache.has('AI_BOTS_ENABLED')) {
        await SystemSettings.findOrCreate({
          where: { key: 'AI_BOTS_ENABLED' },
          defaults: { value: 'true' },
        });
        this.cache.set('AI_BOTS_ENABLED', 'true');
      }

      this._loaded = true;
      console.log('⚙️  Settings loaded:', Object.fromEntries(this.cache));
    } catch (err) {
      console.error('Failed to load settings:', err.message);
      // Default to enabled if DB is unavailable
      this.cache.set('AI_BOTS_ENABLED', 'true');
    }
  }

  /**
   * Get a setting value. Returns from cache (no DB hit).
   * @param {string} key
   * @param {string} [defaultValue]
   * @returns {string}
   */
  get(key, defaultValue = '') {
    return this.cache.get(key) ?? defaultValue;
  }

  /**
   * Check if AI bots are enabled.
   * @returns {boolean}
   */
  areBotsEnabled() {
    return this.get('AI_BOTS_ENABLED', 'true') === 'true';
  }

  /**
   * Update a setting in DB and cache.
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    const [row] = await SystemSettings.findOrCreate({
      where: { key },
      defaults: { value },
    });

    row.value = value;
    await row.save();

    this.cache.set(key, value);
    console.log(`⚙️  Setting updated: ${key} = ${value}`);
  }
}

module.exports = new SettingsService();
