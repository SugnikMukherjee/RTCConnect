// Room Management Service
class RoomService {
  constructor() {
    this.rooms = new Map(); // roomId -> Set of userIds
    this.users = new Map(); // socketId -> { userId, roomId, socketId }
  }

  joinRoom(socketId, roomId, userId) {
    try {
      // Remove user from previous room if exists
      this.leaveRoom(socketId);

      // Add user to new room
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }

      this.rooms.get(roomId).add(socketId);
      this.users.set(socketId, { userId, roomId, socketId });

      return {
        success: true,
        message: `User ${userId} joined room ${roomId}`,
        roomUsers: this.getRoomUsers(roomId)
      };
    } catch (error) {
      return {
        success: false,
        message: `Error joining room: ${error.message}`
      };
    }
  }

  leaveRoom(socketId) {
    try {
      const user = this.users.get(socketId);
      if (!user) return { success: true, message: 'User not in any room' };

      const { roomId } = user;
      
      // Remove user from room
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(socketId);
        
        // Delete room if empty
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }

      // Remove user from users map
      this.users.delete(socketId);

      return {
        success: true,
        message: `User left room ${roomId}`,
        roomUsers: this.getRoomUsers(roomId)
      };
    } catch (error) {
      return {
        success: false,
        message: `Error leaving room: ${error.message}`
      };
    }
  }

  getRoomUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    
    const socketIds = Array.from(this.rooms.get(roomId));
    return socketIds
      .map(socketId => this.users.get(socketId))
      .filter(user => user !== undefined);
  }

  getUserBySocketId(socketId) {
    return this.users.get(socketId);
  }

  getRoomBySocketId(socketId) {
    const user = this.users.get(socketId);
    return user ? user.roomId : null;
  }

  getAllRooms() {
    const roomsList = [];
    for (const [roomId, socketIds] of this.rooms.entries()) {
      roomsList.push({
        roomId,
        userCount: socketIds.size,
        users: this.getRoomUsers(roomId)
      });
    }
    return roomsList;
  }

  isRoomFull(roomId, maxUsers = 8) {
    if (!this.rooms.has(roomId)) return false;
    return this.rooms.get(roomId).size >= maxUsers;
  }
}

module.exports = RoomService;