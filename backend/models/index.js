const sequelize = require('../config/database');
const User = require('./User');
const Game = require('./Game');
const SystemSettings = require('./SystemSettings');
const Follow = require('./Follow');
const Message = require('./Message');

// Define relationships
User.hasMany(Game, { foreignKey: 'whitePlayerId', as: 'whiteGames' });
User.hasMany(Game, { foreignKey: 'blackPlayerId', as: 'blackGames' });
Game.belongsTo(User, { foreignKey: 'whitePlayerId', as: 'whitePlayer' });
Game.belongsTo(User, { foreignKey: 'blackPlayerId', as: 'blackPlayer' });
Game.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

// Follow relationships
User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'followed' });

// Message relationships
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

const db = {
  sequelize,
  User,
  Game,
  SystemSettings,
  Follow,
  Message,
};

module.exports = db;

