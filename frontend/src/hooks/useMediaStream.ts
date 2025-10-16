// Custom hook for managing media streams (camera, microphone, screen share)

import { useState, useRef, useCallback, useEffect } from 'react';
import { MediaState } from '../types';
import { WebRTCManager, mediaConstraints } from '../utils/webrtc';

interface UseMediaStreamReturn {
  mediaState: MediaState;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  startLocalStream: () => Promise<MediaStream | null>;
  stopLocalStream: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  startScreenShare: () => Promise<MediaStream | null>;
  stopScreenShare: () => void;
  error: string | null;
}

export const useMediaStream = (): UseMediaStreamReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    localStream: undefined,
    remoteStreams: new Map(),
  });
  
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);

  const startLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setError(null);
      const stream = await WebRTCManager.getUserMedia(mediaConstraints);
      
      setMediaState(prev => ({
        ...prev,
        localStream: stream,
        isVideoEnabled: WebRTCManager.isVideoEnabled(stream),
        isAudioEnabled: WebRTCManager.isAudioEnabled(stream),
      }));

      // Display local stream in video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      setError(errorMessage);
      console.error('Error starting local stream:', err);
      return null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (mediaState.localStream) {
      WebRTCManager.stopStream(mediaState.localStream);
      
      setMediaState(prev => ({
        ...prev,
        localStream: undefined,
        isVideoEnabled: false,
        isAudioEnabled: false,
      }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [mediaState.localStream]);

  const toggleVideo = useCallback(() => {
    if (mediaState.localStream) {
      const newVideoState = !mediaState.isVideoEnabled;
      WebRTCManager.toggleTrack(mediaState.localStream, 'video', newVideoState);
      
      setMediaState(prev => ({
        ...prev,
        isVideoEnabled: newVideoState,
      }));
    }
  }, [mediaState.localStream, mediaState.isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (mediaState.localStream) {
      const newAudioState = !mediaState.isAudioEnabled;
      WebRTCManager.toggleTrack(mediaState.localStream, 'audio', newAudioState);
      
      setMediaState(prev => ({
        ...prev,
        isAudioEnabled: newAudioState,
      }));
    }
  }, [mediaState.localStream, mediaState.isAudioEnabled]);

  const startScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setError(null);
      const screenStream = await WebRTCManager.getScreenShare();
      
      screenShareStreamRef.current = screenStream;
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      setMediaState(prev => ({
        ...prev,
        isScreenSharing: true,
      }));

      return screenStream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start screen sharing';
      setError(errorMessage);
      console.error('Error starting screen share:', err);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenShareStreamRef.current) {
      WebRTCManager.stopStream(screenShareStreamRef.current);
      screenShareStreamRef.current = null;
      
      setMediaState(prev => ({
        ...prev,
        isScreenSharing: false,
      }));
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (mediaState.isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState.isScreenSharing, startScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream();
      stopScreenShare();
    };
  }, [stopLocalStream, stopScreenShare]);

  return {
    mediaState,
    localVideoRef,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    error,
  };
};

export default useMediaStream;