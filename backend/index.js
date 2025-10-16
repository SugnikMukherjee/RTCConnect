// Video Chat Backend Server
// Main server file with Express and Socket.IO for WebRTC signaling

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import configurations
const serverConfig = require('./config/server');
const webrtcConfig = require('./config/webrtc');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const { requestLogger, Logger } = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes/api');

// Import services
const RoomService = require('./services/roomService');
const User = require('./models/User');
const Room = require('./models/Room');

// Import utilities
const Validator = require('./utils/validator');
const WebRTCHelper = require('./utils/webrtcHelper');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const logger = new Logger();

// Initialize Socket.IO with CORS configuration
const io = new Server(server, serverConfig.SOCKET);

// Initialize services
const roomService = new RoomService();

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware([serverConfig.CORS.origin]));
app.use(requestLogger);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Video Chat Server is running',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join-room', (data) => {
    try {
      const { roomId, userId } = data;
      
      // Validate input
      if (!Validator.isValidRoomId(roomId)) {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }
      
      if (!Validator.isValidUserId(userId)) {
        socket.emit('error', { message: 'Invalid user ID' });
        return;
      }

      // Sanitize input
      const cleanUserId = Validator.sanitizeInput(userId);
      const cleanRoomId = Validator.sanitizeInput(roomId);

      // Join room using room service
      const result = roomService.joinRoom(socket.id, cleanRoomId, cleanUserId);
      
      if (result.success) {
        // Join socket room
        socket.join(cleanRoomId);
        
        // Notify user of successful join
        socket.emit('joined-room', {
          roomId: cleanRoomId,
          userId: cleanUserId,
          users: result.roomUsers
        });

        // Notify other users in room
        socket.to(cleanRoomId).emit('user-joined', {
          userId: cleanUserId,
          socketId: socket.id,
          users: result.roomUsers
        });

        logger.info(`User ${cleanUserId} joined room ${cleanRoomId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    } catch (error) {
      logger.error(`Error joining room: ${error.message}`);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle leaving a room
  socket.on('leave-room', () => {
    try {
      const user = roomService.getUserBySocketId(socket.id);
      if (user) {
        const result = roomService.leaveRoom(socket.id);
        
        if (result.success) {
          // Leave socket room
          socket.leave(user.roomId);
          
          // Notify other users
          socket.to(user.roomId).emit('user-left', {
            userId: user.userId,
            socketId: socket.id,
            users: result.roomUsers
          });

          logger.info(`User ${user.userId} left room ${user.roomId}`);
        }
      }
    } catch (error) {
      logger.error(`Error leaving room: ${error.message}`);
    }
  });

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    try {
      const { targetUserId, offer } = data;
      
      if (!offer || !WebRTCHelper.isValidSDP(offer.sdp)) {
        socket.emit('error', { message: 'Invalid offer' });
        return;
      }

      const user = roomService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not in room' });
        return;
      }

      // Find target user in same room
      const roomUsers = roomService.getRoomUsers(user.roomId);
      const targetUser = roomUsers.find(u => u.userId === targetUserId);
      
      if (targetUser) {
        // Forward offer to target user
        io.to(targetUser.socketId).emit('offer', {
          fromUserId: user.userId,
          fromSocketId: socket.id,
          offer: WebRTCHelper.formatOffer(offer)
        });
        
        logger.debug(`Forwarded offer from ${user.userId} to ${targetUserId}`);
      } else {
        socket.emit('error', { message: 'Target user not found' });
      }
    } catch (error) {
      logger.error(`Error handling offer: ${error.message}`);
      socket.emit('error', { message: 'Failed to process offer' });
    }
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    try {
      const { targetUserId, answer } = data;
      
      if (!answer || !WebRTCHelper.isValidSDP(answer.sdp)) {
        socket.emit('error', { message: 'Invalid answer' });
        return;
      }

      const user = roomService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not in room' });
        return;
      }

      // Find target user in same room
      const roomUsers = roomService.getRoomUsers(user.roomId);
      const targetUser = roomUsers.find(u => u.userId === targetUserId);
      
      if (targetUser) {
        // Forward answer to target user
        io.to(targetUser.socketId).emit('answer', {
          fromUserId: user.userId,
          fromSocketId: socket.id,
          answer: WebRTCHelper.formatAnswer(answer)
        });
        
        logger.debug(`Forwarded answer from ${user.userId} to ${targetUserId}`);
      } else {
        socket.emit('error', { message: 'Target user not found' });
      }
    } catch (error) {
      logger.error(`Error handling answer: ${error.message}`);
      socket.emit('error', { message: 'Failed to process answer' });
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    try {
      const { targetUserId, candidate } = data;
      
      if (!candidate || !WebRTCHelper.isValidIceCandidate(candidate)) {
        socket.emit('error', { message: 'Invalid ICE candidate' });
        return;
      }

      const user = roomService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not in room' });
        return;
      }

      // Find target user in same room
      const roomUsers = roomService.getRoomUsers(user.roomId);
      const targetUser = roomUsers.find(u => u.userId === targetUserId);
      
      if (targetUser) {
        // Forward ICE candidate to target user
        io.to(targetUser.socketId).emit('ice-candidate', {
          fromUserId: user.userId,
          fromSocketId: socket.id,
          candidate: WebRTCHelper.formatIceCandidate(candidate)
        });
        
        logger.debug(`Forwarded ICE candidate from ${user.userId} to ${targetUserId}`);
      }
    } catch (error) {
      logger.error(`Error handling ICE candidate: ${error.message}`);
    }
  });

  // Handle call initiation
  socket.on('call-user', (data) => {
    try {
      const { targetUserId } = data;
      const user = roomService.getUserBySocketId(socket.id);
      
      if (!user) {
        socket.emit('error', { message: 'User not in room' });
        return;
      }

      const roomUsers = roomService.getRoomUsers(user.roomId);
      const targetUser = roomUsers.find(u => u.userId === targetUserId);
      
      if (targetUser) {
        io.to(targetUser.socketId).emit('incoming-call', {
          fromUserId: user.userId,
          fromSocketId: socket.id
        });
        
        logger.info(`Call initiated from ${user.userId} to ${targetUserId}`);
      } else {
        socket.emit('error', { message: 'Target user not found' });
      }
    } catch (error) {
      logger.error(`Error initiating call: ${error.message}`);
    }
  });

  // Handle call acceptance
  socket.on('call-accepted', (data) => {
    try {
      const { fromSocketId } = data;
      const user = roomService.getUserBySocketId(socket.id);
      
      if (user) {
        io.to(fromSocketId).emit('call-accepted', {
          fromUserId: user.userId,
          fromSocketId: socket.id
        });
        
        logger.info(`Call accepted by ${user.userId}`);
      }
    } catch (error) {
      logger.error(`Error handling call acceptance: ${error.message}`);
    }
  });

  // Handle call rejection
  socket.on('call-rejected', (data) => {
    try {
      const { fromSocketId } = data;
      const user = roomService.getUserBySocketId(socket.id);
      
      if (user) {
        io.to(fromSocketId).emit('call-rejected', {
          fromUserId: user.userId
        });
        
        logger.info(`Call rejected by ${user.userId}`);
      }
    } catch (error) {
      logger.error(`Error handling call rejection: ${error.message}`);
    }
  });

  // Handle call end
  socket.on('end-call', (data) => {
    try {
      const { targetUserId } = data;
      const user = roomService.getUserBySocketId(socket.id);
      
      if (!user) return;

      const roomUsers = roomService.getRoomUsers(user.roomId);
      
      if (targetUserId) {
        // End call with specific user
        const targetUser = roomUsers.find(u => u.userId === targetUserId);
        if (targetUser) {
          io.to(targetUser.socketId).emit('call-ended', {
            fromUserId: user.userId
          });
        }
      } else {
        // End call with all users in room
        socket.to(user.roomId).emit('call-ended', {
          fromUserId: user.userId
        });
      }
      
      logger.info(`Call ended by ${user.userId}`);
    } catch (error) {
      logger.error(`Error ending call: ${error.message}`);
    }
  });

  // Handle get room users
  socket.on('get-users', () => {
    try {
      const user = roomService.getUserBySocketId(socket.id);
      if (user) {
        const users = roomService.getRoomUsers(user.roomId);
        socket.emit('room-users', { users });
      }
    } catch (error) {
      logger.error(`Error getting room users: ${error.message}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    try {
      const user = roomService.getUserBySocketId(socket.id);
      if (user) {
        const result = roomService.leaveRoom(socket.id);
        
        if (result.success) {
          // Notify other users
          socket.to(user.roomId).emit('user-left', {
            userId: user.userId,
            socketId: socket.id,
            users: result.roomUsers
          });
        }
        
        logger.info(`User ${user.userId} disconnected and left room ${user.roomId}`);
      } else {
        logger.info(`Client ${socket.id} disconnected`);
      }
    } catch (error) {
      logger.error(`Error handling disconnect: ${error.message}`);
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = serverConfig.PORT;
server.listen(PORT, () => {
  logger.info(`🚀 Video Chat Server running on port ${PORT}`);
  logger.info(`📡 Socket.IO server ready for connections`);
  logger.info(`🌐 CORS enabled for: ${serverConfig.CORS.origin}`);
  logger.info(`🎥 WebRTC signaling server active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };