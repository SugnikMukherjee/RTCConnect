// Validation Utilities
class Validator {
  static isValidRoomId(roomId) {
    return roomId && 
           typeof roomId === 'string' && 
           roomId.length >= 3 && 
           roomId.length <= 50 &&
           /^[a-zA-Z0-9-_]+$/.test(roomId);
  }
  
  static isValidUserId(userId) {
    return userId && 
           typeof userId === 'string' && 
           userId.length >= 2 && 
           userId.length <= 30 &&
           /^[a-zA-Z0-9-_\s]+$/.test(userId);
  }
  
  static isValidSocketId(socketId) {
    return socketId && 
           typeof socketId === 'string' && 
           socketId.length > 0;
  }
  
  static validateWebRTCData(data) {
    const { type, sdp, candidate } = data;
    
    if (type && ['offer', 'answer'].includes(type) && sdp) {
      return { valid: true, type: 'sdp' };
    }
    
    if (candidate) {
      return { valid: true, type: 'ice' };
    }
    
    return { valid: false, error: 'Invalid WebRTC data format' };
  }
  
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 100); // Limit length
  }
}

module.exports = Validator;