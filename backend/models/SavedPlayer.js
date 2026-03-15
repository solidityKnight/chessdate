const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedPlayer = sequelize.define(
  'SavedPlayer',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    targetUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    kind: {
      type: DataTypes.ENUM('favorite', 'rematch_later'),
      allowNull: false
    },
    sourceGameId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'targetUserId', 'kind']
      }
    ]
  }
);

module.exports = SavedPlayer;
