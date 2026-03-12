const sequelize = require('../config/database');
const User = require('./User');
const Game = require('./Game');
const SystemSettings = require('./SystemSettings');

// Define relationships
User.hasMany(Game, { foreignKey: 'whitePlayerId', as: 'whiteGames' });
User.hasMany(Game, { foreignKey: 'blackPlayerId', as: 'blackGames' });
Game.belongsTo(User, { foreignKey: 'whitePlayerId', as: 'whitePlayer' });
Game.belongsTo(User, { foreignKey: 'blackPlayerId', as: 'blackPlayer' });
Game.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

const db = {
  sequelize,
  User,
  Game,
  SystemSettings,
};

module.exports = db;

