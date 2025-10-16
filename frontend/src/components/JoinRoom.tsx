// Join Room Component - Entry point for joining video calls

import React, { useState, useCallback } from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import { validateRoomId, validateUserId } from '../utils/helpers';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import './JoinRoom.css';

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { joinRoom } = useVideoCall();

  const handleJoinRoom = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isJoining) return;
    
    setError(null);
    
    // Validation
    if (!validateRoomId(roomId)) {
      setError('Please enter a valid room ID (3-50 characters, letters, numbers, hyphens, underscores only)');
      return;
    }
    
    if (!validateUserId(userId)) {
      setError('Please enter a valid name (2-30 characters)');
      return;
    }
    
    setIsJoining(true);
    
    try {
      const success = await joinRoom(roomId, userId);
      if (!success) {
        setError('Failed to join room. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }, [roomId, userId, isJoining, joinRoom]);

  const generateRandomRoom = useCallback(() => {
    const randomRoom = Math.random().toString(36).substring(2, 10);
    setRoomId(randomRoom);
  }, []);

  const generateRandomUser = useCallback(() => {
    const randomUser = `User${Math.random().toString(36).substring(2, 6)}`;
    setUserId(randomUser);
  }, []);

  return (
    <div className="join-room-container">
      <div className="join-room-card">
        <div className="join-room-header">
          <h1>🎥 Video Chat</h1>
          <p>Enter a room ID and your name to start a video call</p>
        </div>

        <form onSubmit={handleJoinRoom} className="join-room-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="input-with-button">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID or generate one"
                disabled={isJoining}
                maxLength={50}
              />
              <button
                type="button"
                onClick={generateRandomRoom}
                disabled={isJoining}
                className="generate-btn"
              >
                Random
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userId">Your Name</label>
            <div className="input-with-button">
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your display name"
                disabled={isJoining}
                maxLength={30}
              />
              <button
                type="button"
                onClick={generateRandomUser}
                disabled={isJoining}
                className="generate-btn"
              >
                Random
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isJoining || !roomId.trim() || !userId.trim()}
            className="join-btn"
          >
            {isJoining ? (
              <>
                <span className="spinner"></span>
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </button>
        </form>

        <div className="join-room-info">
          <h3>📋 Instructions</h3>
          <ul>
            <li>Enter a room ID to create or join a room</li>
            <li>Choose a display name (visible to others)</li>
            <li>Allow camera and microphone access when prompted</li>
            <li>Share the room ID with others to invite them</li>
          </ul>
        </div>

        <div className="join-room-features">
          <h3>✨ Features</h3>
          <div className="features-grid">
            <div className="feature">
              <VideocamIcon className="feature-icon" />
              <span>HD Video Calls</span>
            </div>
            <div className="feature">
              <MicIcon className="feature-icon" />
              <span>Crystal Clear Audio</span>
            </div>
            <div className="feature">
              <ChatIcon className="feature-icon" />
              <span>Real-time Chat</span>
            </div>
            <div className="feature">
              <PhoneAndroidIcon className="feature-icon" />
              <span>Mobile Friendly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;