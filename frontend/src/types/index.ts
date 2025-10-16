// TypeScript type definitions for the video chat application

export interface User {
  socketId: string;
  userId: string;
  roomId: string;
  connected: boolean;
  joinedAt: Date;
  lastSeen: Date;
}

export interface Room {
  roomId: string;
  createdBy: string;
  createdAt: Date;
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  participants: User[];
}

export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
  timestamp: number;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  timestamp: number;
}

export interface ICECandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
  timestamp: number;
}

export interface CallState {
  isInCall: boolean;
  isInitiating: boolean;
  isReceiving: boolean;
  callerId?: string;
  calleeId?: string;
  connectionState: RTCPeerConnectionState;
}

export interface MediaState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  localStream?: MediaStream;
  remoteStreams: Map<string, MediaStream>;
}

export interface SocketEvents {
  // Room events
  'join-room': (data: { roomId: string; userId: string }) => void;
  'joined-room': (data: { roomId: string; userId: string; users: User[] }) => void;
  'leave-room': () => void;
  'user-joined': (data: { userId: string; socketId: string; users: User[] }) => void;
  'user-left': (data: { userId: string; socketId: string; users: User[] }) => void;
  'room-users': (data: { users: User[] }) => void;
  
  // WebRTC signaling events
  'offer': (data: { fromUserId: string; fromSocketId: string; offer: WebRTCOffer }) => void;
  'answer': (data: { fromUserId: string; fromSocketId: string; answer: WebRTCAnswer }) => void;
  'ice-candidate': (data: { fromUserId: string; fromSocketId: string; candidate: ICECandidate }) => void;
  
  // Call management events
  'call-user': (data: { targetUserId: string }) => void;
  'incoming-call': (data: { fromUserId: string; fromSocketId: string }) => void;
  'call-accepted': (data: { fromUserId: string; fromSocketId: string }) => void;
  'call-rejected': (data: { fromUserId: string }) => void;
  'call-ended': (data: { fromUserId: string }) => void;
  'end-call': (data: { targetUserId?: string }) => void;
  
  // Utility events
  'get-users': () => void;
  'error': (data: { message: string }) => void;
}

export interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export interface AppContextType {
  // User state
  currentUser: User | null;
  currentRoom: Room | null;
  users: User[];
  
  // Media state
  mediaState: MediaState;
  
  // Call state
  callState: CallState;
  
  // Peer connections
  peerConnections: Map<string, PeerConnection>;
  
  // Actions
  joinRoom: (roomId: string, userId: string) => Promise<boolean>;
  leaveRoom: () => void;
  callUser: (userId: string) => void;
  acceptCall: (fromSocketId: string) => void;
  rejectCall: (fromSocketId: string) => void;
  endCall: (targetUserId?: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => void;
}