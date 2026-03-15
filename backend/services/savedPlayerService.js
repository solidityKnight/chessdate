const { User, SavedPlayer } = require('../models');
const { publicUserAttributes } = require('../utils/userPresentation');

class SavedPlayerService {
  async save(userId, targetUserId, kind, sourceGameId = null) {
    if (!userId || !targetUserId || !kind) {
      throw new Error('Missing saved player details');
    }
    if (userId === targetUserId) {
      throw new Error('You cannot save yourself');
    }

    const [record] = await SavedPlayer.findOrCreate({
      where: { userId, targetUserId, kind },
      defaults: { userId, targetUserId, kind, sourceGameId },
    });

    if (sourceGameId && !record.sourceGameId) {
      record.sourceGameId = sourceGameId;
      await record.save();
    }

    return record;
  }

  async remove(userId, targetUserId, kind) {
    await SavedPlayer.destroy({
      where: { userId, targetUserId, kind },
    });
  }

  async list(userId, kind) {
    const where = { userId };
    if (kind) where.kind = kind;

    const records = await SavedPlayer.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      include: [{ model: User, as: 'targetUser', attributes: publicUserAttributes }],
    });

    return records.map((record) => ({
      id: record.id,
      kind: record.kind,
      sourceGameId: record.sourceGameId,
      updatedAt: record.updatedAt,
      targetUser: record.targetUser,
    }));
  }

  async getKindsMap(userId, targetIds = []) {
    if (!userId || targetIds.length === 0) return new Map();

    const records = await SavedPlayer.findAll({
      where: {
        userId,
        targetUserId: targetIds,
      },
      attributes: ['targetUserId', 'kind'],
    });

    const result = new Map();
    records.forEach((record) => {
      if (!result.has(record.targetUserId)) {
        result.set(record.targetUserId, new Set());
      }
      result.get(record.targetUserId).add(record.kind);
    });

    return result;
  }
}

module.exports = new SavedPlayerService();
