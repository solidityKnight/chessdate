const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSafetyAction = sequelize.define(
  'UserSafetyAction',
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
    type: {
      type: DataTypes.ENUM('block', 'mute'),
      allowNull: false
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'targetUserId', 'type']
      }
    ]
  }
);

module.exports = UserSafetyAction;
