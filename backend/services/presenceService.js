class PresenceService {
  constructor() {
    this.userSockets = new Map();
  }

  setOnline(userId, socketId) {
    if (!userId || !socketId) return;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  setOffline(socketId) {
    if (!socketId) return;
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(socketId)) {
        socketIds.delete(socketId);
        if (socketIds.size === 0) {
          this.userSockets.delete(userId);
        }
        return userId;
      }
    }
    return null;
  }

  isUserOnline(userId) {
    return this.userSockets.has(String(userId));
  }

  getOnlineUserIds() {
    return new Set(this.userSockets.keys());
  }

  getSocketIds(userId) {
    return Array.from(this.userSockets.get(String(userId)) || []);
  }
}

module.exports = new PresenceService();
