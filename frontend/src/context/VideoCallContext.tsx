// Main context provider for video chat application state management

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { 
  AppContextType, 
  User, 
  Room, 
  ICECandidate
} from '../types';
import { useSocket } from '../hooks/useSocket';
import { useMediaStream } from '../hooks/useMediaStream';
import { useWebRTC } from '../hooks/useWebRTC';
import { validateRoomId, validateUserId, sanitizeInput } from '../utils/helpers';

interface VideoCallProviderProps {
  children: ReactNode;
}

const VideoCallContext = createContext<AppContextType | null>(null);

export const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  // Initialize hooks
  const { socket, isConnected, emit, on, off, connect } = useSocket({
    serverUrl: 'http://localhost:3001',
    autoConnect: false,
  });
  const { 
    mediaState, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localVideoRef, 
    startLocalStream, 
    stopLocalStream, 
    toggleVideo, 
    toggleAudio, 
    startScreenShare, 
    stopScreenShare 
  } = useMediaStream();
  
  const {
    peerConnections,
    callState,
    createPeerConnection,
    closePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    addStreamToPeer,
    setCallState,
    closeAllConnections
  } = useWebRTC({
    onRemoteStream: (userId, stream) => {
      console.log('Received remote stream from:', userId);
      // Handle remote stream display
    },
    onConnectionStateChange: (userId, state) => {
      console.log('Connection state changed for', userId, ':', state);
    },
    onIceCandidate: (userId, candidate) => {
      if (currentUser) {
        emit('ice-candidate', { 
          targetUserId: userId, 
          candidate 
        } as any);
      }
    }
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJoinedRoom = (data: { roomId: string; userId: string; users: User[] }) => {
      console.log('Successfully joined room:', data);
      setUsers(data.users);
      setError(null);
    };

    const handleUserJoined = (data: { userId: string; socketId: string; users: User[] }) => {
      console.log('User joined:', data.userId);
      setUsers(data.users);
    };

    const handleUserLeft = (data: { userId: string; socketId: string; users: User[] }) => {
      console.log('User left:', data.userId);
      setUsers(data.users);
      closePeerConnection(data.userId);
    };

    const handleOffer = async (data: { fromUserId: string; fromSocketId: string; offer: any }) => {
      console.log('Received offer from:', data.fromUserId);
      
      try {
        // Create peer connection for the caller
        const pc = createPeerConnection(data.fromUserId, mediaState.localStream);
        if (!pc) return;

        // Set remote description (offer)
        await setRemoteDescription(data.fromUserId, data.offer);
        
        // Create and send answer
        const answer = await createAnswer(data.fromUserId);
        if (answer) {
          emit('answer', { targetUserId: data.fromUserId, answer } as any);
        }
      } catch (error) {
        console.error('Error handling offer:', error);
        setError('Failed to handle incoming call');
      }
    };

    const handleAnswer = async (data: { fromUserId: string; fromSocketId: string; answer: any }) => {
      console.log('Received answer from:', data.fromUserId);
      
      try {
        await setRemoteDescription(data.fromUserId, data.answer);
        setCallState({ isInCall: true, isInitiating: false });
      } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to establish connection');
      }
    };

    const handleIceCandidate = async (data: { fromUserId: string; fromSocketId: string; candidate: ICECandidate }) => {
      console.log('Received ICE candidate from:', data.fromUserId);
      
      try {
        await addIceCandidate(data.fromUserId, data.candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    const handleIncomingCall = (data: { fromUserId: string; fromSocketId: string }) => {
      console.log('Incoming call from:', data.fromUserId);
      setCallState({ 
        isReceiving: true, 
        callerId: data.fromUserId 
      });
    };

    const handleCallAccepted = (data: { fromUserId: string; fromSocketId: string }) => {
      console.log('Call accepted by:', data.fromUserId);
      setCallState({ isInCall: true });
    };

    const handleCallRejected = (data: { fromUserId: string }) => {
      console.log('Call rejected by:', data.fromUserId);
      setCallState({ 
        isInitiating: false, 
        isReceiving: false, 
        callerId: undefined,
        calleeId: undefined
      });
      closePeerConnection(data.fromUserId);
    };

    const handleCallEnded = (data: { fromUserId: string }) => {
      console.log('Call ended by:', data.fromUserId);
      setCallState({ 
        isInCall: false, 
        isInitiating: false, 
        isReceiving: false,
        callerId: undefined,
        calleeId: undefined 
      });
      closePeerConnection(data.fromUserId);
    };

    const handleRoomUsers = (data: { users: User[] }) => {
      setUsers(data.users);
    };

    const handleError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    };

    // Register event listeners
    on('joined-room', handleJoinedRoom);
    on('user-joined', handleUserJoined);
    on('user-left', handleUserLeft);
    on('offer', handleOffer);
    on('answer', handleAnswer);
    on('ice-candidate', handleIceCandidate);
    on('incoming-call', handleIncomingCall);
    on('call-accepted', handleCallAccepted);
    on('call-rejected', handleCallRejected);
    on('call-ended', handleCallEnded);
    on('room-users', handleRoomUsers);
    on('error', handleError);

    // Cleanup
    return () => {
      off('joined-room', handleJoinedRoom);
      off('user-joined', handleUserJoined);
      off('user-left', handleUserLeft);
      off('offer', handleOffer);
      off('answer', handleAnswer);
      off('ice-candidate', handleIceCandidate);
      off('incoming-call', handleIncomingCall);
      off('call-accepted', handleCallAccepted);
      off('call-rejected', handleCallRejected);
      off('call-ended', handleCallEnded);
      off('room-users', handleRoomUsers);
      off('error', handleError);
    };
  }, [socket, isConnected, emit, on, off, createPeerConnection, closePeerConnection, createAnswer, setRemoteDescription, addIceCandidate, setCallState, mediaState.localStream]);

  // Action methods
  const joinRoom = useCallback(async (roomId: string, userId: string): Promise<boolean> => {
    if (!validateRoomId(roomId)) {
      setError('Invalid room ID');
      return false;
    }

    if (!validateUserId(userId)) {
      setError('Invalid user ID');
      return false;
    }

    // Connect to socket if not connected
    if (!isConnected) {
      console.log('Connecting to server...');
      connect();
      
      // Wait for connection
      const connectionPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000); // 10 second timeout
        
        const checkConnection = () => {
          if (socket?.connected) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        checkConnection();
      });
      
      const connected = await connectionPromise;
      if (!connected) {
        setError('Failed to connect to server');
        return false;
      }
    }

    try {
      const cleanRoomId = sanitizeInput(roomId);
      const cleanUserId = sanitizeInput(userId);
      
      // Start local media stream
      const stream = await startLocalStream();
      if (!stream) {
        setError('Failed to access camera/microphone');
        return false;
      }

      // Create user object
      const user: User = {
        socketId: socket?.id || '',
        userId: cleanUserId,
        roomId: cleanRoomId,
        connected: true,
        joinedAt: new Date(),
        lastSeen: new Date()
      };

      setCurrentUser(user);
      
      // Join room via socket
      emit('join-room', { roomId: cleanRoomId, userId: cleanUserId });
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room');
      return false;
    }
  }, [isConnected, socket, emit, startLocalStream, connect]);

  const leaveRoom = useCallback(() => {
    if (currentUser) {
      emit('leave-room');
      
      // Cleanup
      stopLocalStream();
      closeAllConnections();
      setCurrentUser(null);
      setCurrentRoom(null);
      setUsers([]);
      setCallState({ 
        isInCall: false, 
        isInitiating: false, 
        isReceiving: false,
        connectionState: 'new' as RTCPeerConnectionState 
      });
    }
  }, [currentUser, emit, stopLocalStream, closeAllConnections, setCallState]);

  const callUser = useCallback(async (targetUserId: string) => {
    if (!currentUser || !mediaState.localStream) {
      setError('Not ready to make calls');
      return;
    }

    try {
      setCallState({ isInitiating: true, calleeId: targetUserId });
      
      // Create peer connection
      const pc = createPeerConnection(targetUserId, mediaState.localStream);
      if (!pc) {
        setError('Failed to create peer connection');
        return;
      }

      // Create and send offer
      const offer = await createOffer(targetUserId);
      if (offer) {
        emit('offer', { targetUserId, offer } as any);
        emit('call-user', { targetUserId });
      }
    } catch (error) {
      console.error('Error calling user:', error);
      setError('Failed to initiate call');
      setCallState({ isInitiating: false, calleeId: undefined });
    }
  }, [currentUser, mediaState.localStream, createPeerConnection, createOffer, emit, setCallState]);

  const acceptCall = useCallback((fromSocketId: string) => {
    if (callState.callerId && currentUser) {
      emit('call-accepted', { fromSocketId, fromUserId: currentUser.userId } as any);
      setCallState({ 
        isReceiving: false, 
        isInCall: true,
        callerId: undefined 
      });
    }
  }, [callState.callerId, currentUser, emit, setCallState]);

  const rejectCall = useCallback((fromSocketId: string) => {
    if (callState.callerId && currentUser) {
      emit('call-rejected', { fromSocketId, fromUserId: currentUser.userId } as any);
      setCallState({ 
        isReceiving: false,
        callerId: undefined 
      });
    }
  }, [callState.callerId, currentUser, emit, setCallState]);

  const endCall = useCallback((targetUserId?: string) => {
    emit('end-call', { targetUserId });
    
    if (targetUserId) {
      closePeerConnection(targetUserId);
    } else {
      closeAllConnections();
    }
    
    setCallState({ 
      isInCall: false, 
      isInitiating: false, 
      isReceiving: false,
      callerId: undefined,
      calleeId: undefined 
    });
  }, [emit, closePeerConnection, closeAllConnections, setCallState]);

  const toggleScreenShare = useCallback(async () => {
    if (mediaState.isScreenSharing) {
      stopScreenShare();
    } else {
      const screenStream = await startScreenShare();
      if (screenStream && currentUser) {
        // Replace video track in all peer connections
        Array.from(peerConnections.keys()).forEach(userId => {
          addStreamToPeer(userId, screenStream);
        });
      }
    }
  }, [mediaState.isScreenSharing, stopScreenShare, startScreenShare, currentUser, peerConnections, addStreamToPeer]);

  const contextValue: AppContextType = {
    // State
    currentUser,
    currentRoom,
    users,
    mediaState,
    callState,
    peerConnections,
    
    // Actions
    joinRoom,
    leaveRoom,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    toggleScreenShare: toggleScreenShare,
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}
    </VideoCallContext.Provider>
  );
};

// Custom hook to use the context
export const useVideoCall = (): AppContextType => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export default VideoCallProvider;