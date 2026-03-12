const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Some managed Postgres providers (including certain Railway tiers) either:
 * - require SSL, or
 * - do NOT support SSL at all.
 *
 * Instead of assuming "DATABASE_URL means SSL", we make SSL opt‑in via
 * DB_SSL=true. This lets you connect to non‑SSL databases like the one you
 * just provisioned, while still supporting SSL if you enable it explicitly.
 */
const shouldUseSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost:5432/chessdate',
  {
    dialect: 'postgres',
    logging: false,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    dialectOptions: shouldUseSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {}
  }
);

module.exports = sequelize;