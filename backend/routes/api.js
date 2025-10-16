// Basic Routes
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

// Health check route
router.get('/health', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Video Chat Server is running',
    timestamp: new Date().toISOString()
  });
}));

// Get server info
router.get('/info', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Video Chat Backend',
      version: '1.0.0',
      description: 'WebRTC Video Chat Server with Socket.IO',
      features: ['WebRTC', 'Socket.IO', 'Room Management']
    }
  });
}));

module.exports = router;