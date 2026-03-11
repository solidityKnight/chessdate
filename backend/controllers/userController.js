const { User, Game } = require('../models');
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
      order: [['startedAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, as: 'whitePlayer', attributes: ['username'] },
        { model: User, as: 'blackPlayer', attributes: ['username'] }
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
