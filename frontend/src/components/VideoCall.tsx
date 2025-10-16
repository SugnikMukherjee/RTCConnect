// Video Call Component - Main video calling interface with Zoom-like interface

import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PhoneIcon from '@mui/icons-material/Phone';
import './VideoCall.css';

const VideoCall: React.FC = () => {
  const {
    currentUser,
    users,
    mediaState,
    callState,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    callUser,
    acceptCall,
    rejectCall,
    endCall
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && mediaState.localStream) {
      localVideoRef.current.srcObject = mediaState.localStream;
    }
  }, [mediaState.localStream]);

  const handleCallUser = (targetUserId: string) => {
    if (targetUserId !== currentUser?.userId) {
      callUser(targetUserId);
    }
  };

  const handleAcceptCall = () => {
    if (callState.callerId) {
      acceptCall(''); // We'll need to track the socket ID properly
    }
  };

  const handleRejectCall = () => {
    if (callState.callerId) {
      rejectCall(''); // We'll need to track the socket ID properly
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="video-call-container">
      {/* Header */}
      <div className="video-call-header">
        <div className="room-info">
          <h2>Room: {currentUser.roomId}</h2>
          <span>{users.length} participant(s)</span>
        </div>
        <button onClick={leaveRoom} className="leave-btn">
          Leave Room
        </button>
      </div>

      {/* Incoming Call Modal */}
      {callState.isReceiving && (
        <div className="incoming-call-modal">
          <div className="modal-content">
            <h3><PhoneIcon className="modal-icon" /> Incoming Call</h3>
            <p>Call from: {callState.callerId}</p>
            <div className="call-actions">
              <button onClick={handleAcceptCall} className="accept-btn">
                Accept
              </button>
              <button onClick={handleRejectCall} className="reject-btn">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="video-grid">
        {/* Local Video */}
        <div className="video-container local-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <div className="video-overlay">
            <span className="user-name">You ({currentUser.userId})</span>
            {!mediaState.isVideoEnabled && <span className="video-disabled"><VideocamOffIcon className="status-icon" /> Off</span>}
            {!mediaState.isAudioEnabled && <span className="audio-disabled"><MicOffIcon className="status-icon" /></span>}
          </div>
        </div>

        {/* Remote Videos */}
        {users.filter(user => user.userId !== currentUser.userId).map(user => (
          <div key={user.userId} className="video-container remote-video">
            <video
              ref={(ref) => {
                if (ref) {
                  remoteVideoRefs.current.set(user.userId, ref);
                }
              }}
              autoPlay
              playsInline
              className="video-element"
            />
            <div className="video-overlay">
              <div className="user-info">
                <span className="user-name">{user.userId}</span>
                <div className="status-indicators">
                  {/* Status indicators would be managed by peer connection state */}
                </div>
              </div>
              {!callState.isInCall && (
                <button 
                  onClick={() => handleCallUser(user.userId)}
                  className="call-user-btn zoom-style"
                  disabled={callState.isInitiating}
                >
                  {callState.isInitiating && callState.calleeId === user.userId ? 
                    <><CallIcon className="call-icon" /> Calling...</> : 
                    <><CallIcon className="call-icon" /> Call</>
                  }
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="video-controls">
        <div className="control-group">
          <button 
            onClick={toggleAudio} 
            className={`control-btn audio-btn ${mediaState.isAudioEnabled ? 'active' : 'muted'}`}
            title={mediaState.isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            <span className="control-icon">
              {mediaState.isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </span>
            <span className="control-label">
              {mediaState.isAudioEnabled ? 'Mute' : 'Unmute'}
            </span>
          </button>

          <button 
            onClick={toggleVideo} 
            className={`control-btn video-btn ${mediaState.isVideoEnabled ? 'active' : 'muted'}`}
            title={mediaState.isVideoEnabled ? 'Stop video' : 'Start video'}
          >
            <span className="control-icon">
              {mediaState.isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </span>
            <span className="control-label">
              {mediaState.isVideoEnabled ? 'Stop video' : 'Start video'}
            </span>
          </button>

          <button 
            onClick={toggleScreenShare} 
            className={`control-btn screen-btn ${mediaState.isScreenSharing ? 'active' : ''}`}
            title={mediaState.isScreenSharing ? 'Stop share' : 'Share screen'}
          >
            <span className="control-icon">�️</span>
            <span className="control-label">
              {mediaState.isScreenSharing ? 'Stop share' : 'Share screen'}
            </span>
          </button>
        </div>

        {callState.isInCall && (
          <button onClick={handleEndCall} className="end-call-btn">
            <span className="control-icon"><CallEndIcon /></span>
            <span className="control-label">End call</span>
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <span className={`status ${callState.connectionState}`}>
          {callState.connectionState === 'connected' ? '🟢' : 
           callState.connectionState === 'connecting' ? '🟡' : '🔴'} 
          {callState.connectionState}
        </span>
      </div>
    </div>
  );
};

export default VideoCall;