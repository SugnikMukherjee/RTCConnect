// Custom hook for managing WebRTC peer connections

import { useState, useCallback, useEffect } from 'react';
import { PeerConnection, CallState, ICECandidate } from '../types';
import { WebRTCManager, webrtcConfig } from '../utils/webrtc';

interface UseWebRTCOptions {
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
  onIceCandidate?: (userId: string, candidate: ICECandidate) => void;
}

interface UseWebRTCReturn {
  peerConnections: Map<string, PeerConnection>;
  callState: CallState;
  createPeerConnection: (userId: string, localStream?: MediaStream) => RTCPeerConnection | null;
  closePeerConnection: (userId: string) => void;
  createOffer: (userId: string) => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: (userId: string) => Promise<RTCSessionDescriptionInit | null>;
  setRemoteDescription: (userId: string, description: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (userId: string, candidate: ICECandidate) => Promise<void>;
  addStreamToPeer: (userId: string, stream: MediaStream) => void;
  removeStreamFromPeer: (userId: string, stream: MediaStream) => void;
  setCallState: (state: Partial<CallState>) => void;
  closeAllConnections: () => void;
  endCall: (peerId: string) => void;
}

export const useWebRTC = (options: UseWebRTCOptions = {}): UseWebRTCReturn => {
  const { onRemoteStream, onConnectionStateChange, onIceCandidate } = options;
  
  const [peerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [callState, setCallStateInternal] = useState<CallState>({
    isInCall: false,
    isInitiating: false,
    isReceiving: false,
    connectionState: 'new' as RTCPeerConnectionState,
  });

  const createPeerConnection = useCallback((userId: string, localStream?: MediaStream): RTCPeerConnection | null => {
    try {
      // Close existing connection if it exists
      closePeerConnection(userId);

      const peerConnection = WebRTCManager.createPeerConnection(webrtcConfig);
      
      // Set up event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && onIceCandidate) {
          const candidate: ICECandidate = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
            sdpMid: event.candidate.sdpMid || '',
            timestamp: Date.now(),
          };
          onIceCandidate(userId, candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        console.log('Received remote stream from:', userId);
        if (event.streams && event.streams[0] && onRemoteStream) {
          onRemoteStream(userId, event.streams[0]);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed for', userId, ':', peerConnection.connectionState);
        
        setCallStateInternal(prev => ({
          ...prev,
          connectionState: peerConnection.connectionState,
        }));

        if (onConnectionStateChange) {
          onConnectionStateChange(userId, peerConnection.connectionState);
        }

        // Handle connection failure or closure
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
          closePeerConnection(userId);
        }
      };

      peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state changed for', userId, ':', peerConnection.iceGatheringState);
      };

      // Add local stream if provided
      if (localStream) {
        WebRTCManager.addStreamToPeerConnection(peerConnection, localStream);
      }

      // Store the peer connection
      const peerConnectionInfo: PeerConnection = {
        userId,
        connection: peerConnection,
        localStream,
      };
      
      peerConnections.set(userId, peerConnectionInfo);
      
      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection for', userId, ':', error);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConnections, onRemoteStream, onConnectionStateChange, onIceCandidate]);

  const closePeerConnection = useCallback((userId: string) => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (peerConnectionInfo) {
      peerConnectionInfo.connection.close();
      peerConnections.delete(userId);
      console.log('Closed peer connection for:', userId);
    }
  }, [peerConnections]);

  const createOffer = useCallback(async (userId: string): Promise<RTCSessionDescriptionInit | null> => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (!peerConnectionInfo) {
      console.error('No peer connection found for:', userId);
      return null;
    }

    try {
      const offer = await WebRTCManager.createOffer(peerConnectionInfo.connection);
      console.log('Created offer for:', userId);
      return offer;
    } catch (error) {
      console.error('Error creating offer for', userId, ':', error);
      return null;
    }
  }, [peerConnections]);

  const createAnswer = useCallback(async (userId: string): Promise<RTCSessionDescriptionInit | null> => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (!peerConnectionInfo) {
      console.error('No peer connection found for:', userId);
      return null;
    }

    try {
      const answer = await WebRTCManager.createAnswer(peerConnectionInfo.connection);
      console.log('Created answer for:', userId);
      return answer;
    } catch (error) {
      console.error('Error creating answer for', userId, ':', error);
      return null;
    }
  }, [peerConnections]);

  const setRemoteDescription = useCallback(async (userId: string, description: RTCSessionDescriptionInit): Promise<void> => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (!peerConnectionInfo) {
      console.error('No peer connection found for:', userId);
      return;
    }

    try {
      await peerConnectionInfo.connection.setRemoteDescription(description);
      console.log('Set remote description for:', userId, description.type);
    } catch (error) {
      console.error('Error setting remote description for', userId, ':', error);
      throw error;
    }
  }, [peerConnections]);

  const addIceCandidate = useCallback(async (userId: string, candidate: ICECandidate): Promise<void> => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (!peerConnectionInfo) {
      console.error('No peer connection found for:', userId);
      return;
    }

    try {
      await WebRTCManager.addIceCandidate(peerConnectionInfo.connection, candidate);
      console.log('Added ICE candidate for:', userId);
    } catch (error) {
      console.error('Error adding ICE candidate for', userId, ':', error);
    }
  }, [peerConnections]);

  const addStreamToPeer = useCallback((userId: string, stream: MediaStream) => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (peerConnectionInfo) {
      WebRTCManager.addStreamToPeerConnection(peerConnectionInfo.connection, stream);
      peerConnectionInfo.localStream = stream;
      console.log('Added stream to peer connection for:', userId);
    }
  }, [peerConnections]);

  const removeStreamFromPeer = useCallback((userId: string, stream: MediaStream) => {
    const peerConnectionInfo = peerConnections.get(userId);
    if (peerConnectionInfo) {
      WebRTCManager.removeStreamFromPeerConnection(peerConnectionInfo.connection, stream);
      console.log('Removed stream from peer connection for:', userId);
    }
  }, [peerConnections]);

  const setCallState = useCallback((state: Partial<CallState>) => {
    setCallStateInternal(prev => ({ ...prev, ...state }));
  }, []);

  const closeAllConnections = useCallback(() => {
    Array.from(peerConnections.keys()).forEach(userId => {
      closePeerConnection(userId);
    });
    peerConnections.clear();
    
    setCallStateInternal({
      isInCall: false,
      isInitiating: false,
      isReceiving: false,
      connectionState: 'new' as RTCPeerConnectionState,
    });
    
    console.log('Closed all peer connections');
  }, [peerConnections, closePeerConnection]);

  const endCall = useCallback((peerId: string) => {
    const peer = peerConnections.get(peerId);
    if (peer) {
      closePeerConnection(peerId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConnections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeAllConnections();
    };
  }, [closeAllConnections]);

  return {
    peerConnections,
    callState,
    createPeerConnection,
    closePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    addStreamToPeer,
    removeStreamFromPeer,
    setCallState,
    closeAllConnections,
    endCall,
  };
};

export default useWebRTC;