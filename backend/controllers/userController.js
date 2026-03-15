const { User, Game, UserSafetyAction } = require('../models');
const { Op } = require('sequelize');
const followService = require('../services/followService');
const presenceService = require('../services/presenceService');
const savedPlayerService = require('../services/savedPlayerService');
const {
  normalizeMatchPreferences,
  sanitizeUser,
  getProfileCompletion,
} = require('../utils/userPresentation');

const safeRecentPlayerAttributes = ['id', 'username', 'displayName', 'profilePhoto'];

const isTruthyFilter = (value) =>
  value === true || value === 'true' || value === '1';

const enrichUsersForViewer = async (viewerId, users) => {
  if (!viewerId || users.length === 0) return [];

  const targetIds = users.map((user) => String(user.id));
  const [
    messageCandidates,
    mutualFollowIds,
    savedKindsMap,
    followers,
    mutedIds,
    blockedIds,
    blockedByRows,
  ] = await Promise.all([
    followService.getConversationCandidates(viewerId),
    followService.getMutualFollowIds(viewerId, targetIds),
    savedPlayerService.getKindsMap(viewerId, targetIds),
    followService.listFollows(viewerId, 'followers'),
    UserSafetyAction.findAll({
      where: { userId: viewerId, type: 'mute', targetUserId: targetIds },
      attributes: ['targetUserId'],
    }),
    UserSafetyAction.findAll({
      where: { userId: viewerId, type: 'block', targetUserId: targetIds },
      attributes: ['targetUserId'],
    }),
    UserSafetyAction.findAll({
      where: { type: 'block', userId: targetIds, targetUserId: viewerId },
      attributes: ['userId'],
    }),
  ]);

  const messageReadyIds = new Set(messageCandidates.map((user) => String(user.id)));
  const followerIds = new Set(followers.map((user) => String(user.id)));
  const mutedSet = new Set(mutedIds.map((entry) => String(entry.targetUserId)));
  const blockedSet = new Set(blockedIds.map((entry) => String(entry.targetUserId)));
  const blockedByThemSet = new Set(blockedByRows.map((entry) => String(entry.userId)));

  return users
    .filter((user) => {
      const userId = String(user.id);
      return !blockedSet.has(userId) && !blockedByThemSet.has(userId);
    })
    .map((user) => {
      const userId = String(user.id);
      const value = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

      return {
        ...value,
        isOnline: presenceService.isUserOnline(userId),
        profileCompletion: getProfileCompletion(value),
        mutualFollow: mutualFollowIds.has(userId),
        followsYou: followerIds.has(userId),
        canMessage: messageReadyIds.has(userId),
        isMuted: mutedSet.has(userId),
        savedKinds: Array.from(savedKindsMap.get(userId) || []),
      };
    });
};

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
        { model: User, as: 'whitePlayer', attributes: safeRecentPlayerAttributes },
        { model: User, as: 'blackPlayer', attributes: safeRecentPlayerAttributes }
      ]
    });

    res.json({
      user: sanitizeUser(user),
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
      latitude, longitude, city, country, preferredMatchDistance, learnMode,
      matchPreferences
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
    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto;
      user.isProfilePhotoVerified = false;
    }
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (preferredMatchDistance !== undefined) user.preferredMatchDistance = preferredMatchDistance;
    if (learnMode !== undefined) user.learnMode = learnMode;
    if (matchPreferences !== undefined) {
      user.matchPreferences = normalizeMatchPreferences(matchPreferences);
    }
    user.lastActiveAt = new Date();

    await user.save();

    res.json({ message: 'Profile updated successfully', user: sanitizeUser(user) });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const {
      q,
      minElo,
      maxElo,
      country,
      online,
      followersOnly,
      availableToMessage,
    } = req.query;

    const trimmedQuery = String(q || '').trim();
    const hasActiveFilters =
      Boolean(trimmedQuery) ||
      minElo !== undefined ||
      maxElo !== undefined ||
      Boolean(country) ||
      isTruthyFilter(online) ||
      isTruthyFilter(followersOnly) ||
      isTruthyFilter(availableToMessage);

    if (!hasActiveFilters) {
      return res.json([]);
    }

    const where = {
      id: { [Op.ne]: req.user.id },
    };

    if (trimmedQuery) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${trimmedQuery}%` } },
        { displayName: { [Op.iLike]: `%${trimmedQuery}%` } }
      ];
    }

    if (minElo !== undefined || maxElo !== undefined) {
      where.eloRating = {};
      if (minElo !== undefined) where.eloRating[Op.gte] = Number(minElo);
      if (maxElo !== undefined) where.eloRating[Op.lte] = Number(maxElo);
    }

    if (country) {
      where.country = { [Op.iLike]: `%${String(country).trim()}%` };
    }

    const users = await User.findAll({
      where,
      attributes: {
        exclude: ['password']
      },
      limit: 60,
      order: [['eloRating', 'DESC']]
    });

    let enrichedUsers = await enrichUsersForViewer(req.user.id, users);

    if (isTruthyFilter(online)) {
      enrichedUsers = enrichedUsers.filter((user) => user.isOnline);
    }
    if (isTruthyFilter(followersOnly)) {
      enrichedUsers = enrichedUsers.filter((user) => user.followsYou);
    }
    if (isTruthyFilter(availableToMessage)) {
      enrichedUsers = enrichedUsers.filter((user) => user.canMessage);
    }

    res.json(enrichedUsers.slice(0, 20));
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const {
      minElo,
      maxElo,
      country,
      online,
      followersOnly,
      availableToMessage,
    } = req.query;

    const where = {
      id: { [Op.ne]: req.user.id }
    };

    if (minElo !== undefined || maxElo !== undefined) {
      where.eloRating = {};
      if (minElo !== undefined) where.eloRating[Op.gte] = Number(minElo);
      if (maxElo !== undefined) where.eloRating[Op.lte] = Number(maxElo);
    }

    if (country) {
      where.country = { [Op.iLike]: `%${String(country).trim()}%` };
    }

    const topPlayers = await User.findAll({
      where,
      order: [['eloRating', 'DESC']],
      limit: 100,
      attributes: { exclude: ['password'] }
    });

    let enrichedUsers = await enrichUsersForViewer(req.user.id, topPlayers);

    if (isTruthyFilter(online)) {
      enrichedUsers = enrichedUsers.filter((user) => user.isOnline);
    }
    if (isTruthyFilter(followersOnly)) {
      enrichedUsers = enrichedUsers.filter((user) => user.followsYou);
    }
    if (isTruthyFilter(availableToMessage)) {
      enrichedUsers = enrichedUsers.filter((user) => user.canMessage);
    }

    res.json(enrichedUsers);
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
