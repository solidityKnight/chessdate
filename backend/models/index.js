const sequelize = require('../config/database');
const User = require('./User');
const Game = require('./Game');
const SystemSettings = require('./SystemSettings');
const Follow = require('./Follow');
const Message = require('./Message');
const UserSafetyAction = require('./UserSafetyAction');
const UserReport = require('./UserReport');
const SavedPlayer = require('./SavedPlayer');

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

// Safety relationships
User.hasMany(UserSafetyAction, { foreignKey: 'userId', as: 'safetyActions' });
User.hasMany(UserSafetyAction, { foreignKey: 'targetUserId', as: 'safetyTargetActions' });
UserSafetyAction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserSafetyAction.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

// Reports
User.hasMany(UserReport, { foreignKey: 'reporterId', as: 'reportsCreated' });
User.hasMany(UserReport, { foreignKey: 'targetUserId', as: 'reportsReceived' });
UserReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
UserReport.belongsTo(User, { foreignKey: 'targetUserId', as: 'reportedUser' });

// Saved players
User.hasMany(SavedPlayer, { foreignKey: 'userId', as: 'savedPlayers' });
User.hasMany(SavedPlayer, { foreignKey: 'targetUserId', as: 'savedByPlayers' });
SavedPlayer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SavedPlayer.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

const db = {
  sequelize,
  User,
  Game,
  SystemSettings,
  Follow,
  Message,
  UserSafetyAction,
  UserReport,
  SavedPlayer,
};

module.exports = db;
