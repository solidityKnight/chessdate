const { User, Game, Follow } = require('../models');
const { Op } = require('sequelize');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const recentGames = await Game.findAll({
      where: {
        [Op.or]: [
          { whitePlayerId: user.id },
          { blackPlayerId: user.id }
        ]
      },
      order: [['createdAt', 'DESC']], // Changed from startedAt to createdAt as startedAt might not exist
      limit: 10,
      include: [
        { model: User, as: 'whitePlayer', attributes: ['username', 'displayName', 'profilePhoto'] },
        { model: User, as: 'blackPlayer', attributes: ['username', 'displayName', 'profilePhoto'] }
      ]
    });

    res.json({
      user,
      recentGames
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { 
      displayName, age, bio, interests, profilePhoto,
      latitude, longitude, city, country, preferredMatchDistance 
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (displayName !== undefined) user.displayName = displayName;
    if (age !== undefined) user.age = age;
    if (bio !== undefined) user.bio = bio;
    if (interests !== undefined) user.interests = interests;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (preferredMatchDistance !== undefined) user.preferredMatchDistance = preferredMatchDistance;

    await user.save();

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${q}%` } },
          { displayName: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'username', 'displayName', 'eloRating', 'profilePhoto', 'country'],
      limit: 20
    });

    res.json(users);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const topPlayers = await User.findAll({
      order: [['eloRating', 'DESC']],
      limit: 100,
      attributes: ['id', 'username', 'displayName', 'eloRating', 'wins', 'losses', 'draws', 'profilePhoto', 'country']
    });

    res.json(topPlayers);
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
