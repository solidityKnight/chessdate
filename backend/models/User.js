const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 20]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  gamesPlayedInCredit: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastCreditRegen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Profile Info
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interests: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  profilePhoto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isProfilePhotoVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Location
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredMatchDistance: {
    type: DataTypes.INTEGER,
    defaultValue: 100 // Default 100km
  },
  matchPreferences: {
    type: DataTypes.JSONB,
    defaultValue: ['male', 'female']
  },
  learnMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Stats
  eloRating: {
    type: DataTypes.INTEGER,
    defaultValue: 1200
  },
  gamesPlayed: { type: DataTypes.INTEGER, defaultValue: 0 },
  wins: { type: DataTypes.INTEGER, defaultValue: 0 },
  losses: { type: DataTypes.INTEGER, defaultValue: 0 },
  draws: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalMessages: { type: DataTypes.INTEGER, defaultValue: 0 },
    winStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxWinStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Achievements (stored as JSON array)
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
