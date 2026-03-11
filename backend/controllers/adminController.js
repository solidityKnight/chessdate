const { User, Game } = require('../models');
const { Op } = require('sequelize');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Admin searchUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCredits = async (req, res) => {
  try {
    const { userId, credits } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.credits = credits;
    await user.save();

    res.json({ message: 'Credits updated successfully', user });
  } catch (error) {
    console.error('Admin updateCredits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalGames = await Game.count();
    const activeGames = await Game.count({ where: { status: 'active' } });

    res.json({
      totalUsers,
      totalGames,
      activeGames
    });
  } catch (error) {
    console.error('Admin getStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
