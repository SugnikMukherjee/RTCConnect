# Video Chat Backend

## Overview
A robust WebRTC video chat backend built with Node.js, Express, and Socket.IO for real-time communication.

## Features
- ✅ Real-time WebRTC signaling with Socket.IO
- ✅ Room-based video calls
- ✅ User management and presence
- ✅ ICE candidate exchange
- ✅ Offer/Answer SDP handling
- ✅ Error handling and logging
- ✅ CORS configuration
- ✅ Environment-based configuration

## Project Structure
```
backend/
├── config/           # Configuration files
│   ├── server.js     # Server configuration
│   ├── webrtc.js     # WebRTC configuration
│   └── environment.js # Environment settings
├── controllers/      # Request controllers
├── middleware/       # Express middleware
│   ├── cors.js       # CORS configuration
│   ├── logger.js     # Logging middleware
│   └── errorHandler.js # Error handling
├── models/           # Data models
│   ├── User.js       # User model
│   └── Room.js       # Room model
├── routes/           # API routes
│   └── api.js        # Basic API routes
├── services/         # Business logic
│   └── roomService.js # Room management
├── socket/           # Socket.IO handlers
│   └── socketEvents.js # Socket event handlers
├── utils/            # Utility functions
│   ├── validator.js  # Input validation
│   ├── webrtcHelper.js # WebRTC helpers
│   └── helpers.js    # General utilities
├── logs/             # Log files
├── index.js          # Main server file
└── package.json      # Dependencies and scripts
```

## Installation
```bash
# Install dependencies
npm install

# Install dotenv for environment variables
npm install dotenv

# Copy environment variables
cp .env.example .env
```

## Usage
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Environment Variables
Create a `.env` file based on `.env.example`:
- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment mode

## Socket.IO Events

### Room Management
- `join-room`: Join a video chat room
- `leave-room`: Leave current room
- `get-users`: Get list of users in room

### WebRTC Signaling
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Exchange ICE candidates

### Call Management
- `call-user`: Initiate call to user
- `call-accepted`: Accept incoming call
- `call-rejected`: Reject incoming call
- `end-call`: End current call

## API Endpoints
- `GET /api/health`: Health check
- `GET /api/info`: Server information

## Next Steps
1. Install remaining dependencies: `npm install dotenv`
2. Create `.env` file from `.env.example`
3. Implement the main server file (`index.js`)
4. Test the Socket.IO connections
5. Set up the frontend React application