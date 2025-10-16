// User Model (In-memory for now)
class User {
  constructor(socketId, userId, roomId) {
    this.socketId = socketId;
    this.userId = userId;
    this.roomId = roomId;
    this.connected = true;
    this.joinedAt = new Date();
    this.lastSeen = new Date();
  }

  updateLastSeen() {
    this.lastSeen = new Date();
  }

  disconnect() {
    this.connected = false;
    this.lastSeen = new Date();
  }

  toJSON() {
    return {
      socketId: this.socketId,
      userId: this.userId,
      roomId: this.roomId,
      connected: this.connected,
      joinedAt: this.joinedAt,
      lastSeen: this.lastSeen
    };
  }
}

module.exports = User;