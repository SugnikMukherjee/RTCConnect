// WebRTC Configuration
const buildIceServers = () => {
  const iceServers = [];
  
  // Add STUN servers
  if (process.env.STUN_SERVER_URL) {
    iceServers.push({ urls: process.env.STUN_SERVER_URL });
  }
  if (process.env.STUN_SERVER_URL_2) {
    iceServers.push({ urls: process.env.STUN_SERVER_URL_2 });
  }
  
  // Add TURN servers if configured
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }
  
  // Fallback STUN servers if none configured
  if (iceServers.length === 0) {
    iceServers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    );
  }
  
  return iceServers;
};

module.exports = {
  // ICE Servers Configuration
  iceServers: buildIceServers(),
  
  // Peer Connection Configuration
  peerConnectionConfig: {
    iceServers: buildIceServers(),
    iceCandidatePoolSize: 10
  },
  
  // Media Constraints
  mediaConstraints: {
    video: {
      width: { ideal: process.env.VIDEO_RESOLUTION === '1080p' ? 1920 : 1280 },
      height: { ideal: process.env.VIDEO_RESOLUTION === '1080p' ? 1080 : 720 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  },
  
  // Room Configuration
  room: {
    maxParticipants: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM) || 8,
    timeout: 30000, // 30 seconds
    cleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL) || 60000,
    idleTimeout: parseInt(process.env.ROOM_IDLE_TIMEOUT) || 300000
  },
  
  // Bitrate Configuration
  bitrate: {
    video: parseInt(process.env.MAX_VIDEO_BITRATE) || 1000000, // 1 Mbps
    audio: parseInt(process.env.MAX_AUDIO_BITRATE) || 64000    // 64 kbps
  }
};