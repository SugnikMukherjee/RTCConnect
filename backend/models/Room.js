// Room Model (In-memory for now)
class Room {
  constructor(roomId, createdBy) {
    this.roomId = roomId;
    this.createdBy = createdBy;
    this.participants = new Map(); // socketId -> User
    this.createdAt = new Date();
    this.maxParticipants = 8;
    this.isActive = true;
  }

  addParticipant(user) {
    if (this.participants.size >= this.maxParticipants) {
      throw new Error('Room is full');
    }
    this.participants.set(user.socketId, user);
  }

  removeParticipant(socketId) {
    return this.participants.delete(socketId);
  }

  getParticipant(socketId) {
    return this.participants.get(socketId);
  }

  getAllParticipants() {
    return Array.from(this.participants.values());
  }

  getParticipantCount() {
    return this.participants.size;
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  isFull() {
    return this.participants.size >= this.maxParticipants;
  }

  toJSON() {
    return {
      roomId: this.roomId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      participantCount: this.getParticipantCount(),
      maxParticipants: this.maxParticipants,
      isActive: this.isActive,
      participants: this.getAllParticipants().map(user => user.toJSON())
    };
  }
}

module.exports = Room;