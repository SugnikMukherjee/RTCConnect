// WebRTC Helper Functions
class WebRTCHelper {
  static generateRoomId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  static generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  static formatOffer(offer) {
    return {
      type: 'offer',
      sdp: offer.sdp,
      timestamp: Date.now()
    };
  }
  
  static formatAnswer(answer) {
    return {
      type: 'answer',
      sdp: answer.sdp,
      timestamp: Date.now()
    };
  }
  
  static formatIceCandidate(candidate) {
    return {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      timestamp: Date.now()
    };
  }
  
  static isValidIceCandidate(candidate) {
    return candidate && 
           typeof candidate.candidate === 'string' &&
           typeof candidate.sdpMLineIndex === 'number';
  }
  
  static isValidSDP(sdp) {
    return sdp && 
           typeof sdp === 'string' &&
           (sdp.includes('v=0') || sdp.includes('a='));
  }
  
  static getPeerConnectionConfig() {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };
  }
}

module.exports = WebRTCHelper;