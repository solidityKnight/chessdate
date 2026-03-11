const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  gameId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  whitePlayerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  blackPlayerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'finished'),
    defaultValue: 'active'
  },
  winnerId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  result: {
    type: DataTypes.STRING,
    allowNull: true
  },
  moves: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  chatMessages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Game;
