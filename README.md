
# RTCConnect

Lightweight WebRTC video chat demo with a Node.js + Socket.IO backend (signaling) and a React + TypeScript frontend.

This README gives quick setup, environment examples, and tips for local development.

## Table of contents

- [Quick start](#quick-start)
   - [Backend](#backend)
   - [Frontend](#frontend)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Development notes](#development-notes)
- [API / Socket events](#api--socket-events)
- [Contributing](#contributing)
- [License](#license)

## Quick start

Run backend and frontend in two terminals. The examples below are PowerShell-friendly.

### Backend

1. Change into the backend folder and install:

```powershell
cd 'c:\Users\sugni\Documents\Code Workspace\JS Projects\video_chat\backend'
npm install
```

2. (Optional) Create a `.env` file to override defaults. Example:

```ini
# backend/.env
PORT=3001
CLIENT_URL=http://localhost:3000
```

3. Start the server (development):

```powershell
npm run dev
```

or production:

```powershell
npm start
```

Default values are in `backend/config/server.js` (PORT 3001 and CLIENT_URL http://localhost:3000).

### Frontend

1. Change into the frontend folder and install:

```powershell
cd 'c:\Users\sugni\Documents\Code Workspace\JS Projects\video_chat\frontend'
npm install
```

2. Start the development server (Create React App):

```powershell
npm start
```

The CRA dev server normally starts on http://localhost:3000. The frontend expects the signaling server at http://localhost:3001 by default.

## Environment variables

Backend example (`backend/.env`):

```ini
# Port the server listens on
PORT=3001

# Frontend origin allowed by CORS (set to your frontend dev server URL)
CLIENT_URL=http://localhost:3000
```

Frontend example (`frontend/.env` — optional CRA vars):

```ini
# Example: override homepage for production builds
# REACT_APP_API_URL=http://localhost:3001
```

## Project structure

- backend/
   - `index.js` — main server and Socket.IO wiring
   - `config/` — server and WebRTC configuration
   - `routes/` — HTTP API routes
   - `services/` — room and user management
   - `socket/` — socket event handlers

- frontend/
   - `src/` — React + TypeScript source
   - `src/hooks/` — custom hooks (media, socket, WebRTC)
   - `src/components/` — UI (JoinRoom, VideoCall)

## Development notes

- The backend is a signaling server only. It coordinates WebRTC offers/answers and ICE candidates via Socket.IO and manages rooms/users.
- If frontend and backend run on different origins, set `CLIENT_URL` in backend to the frontend origin to avoid CORS issues.
- For local testing across devices, run the backend on a reachable IP or use tunneling (ngrok/localtunnel) and point the frontend to that URL.

## API / Socket events

The app primarily uses Socket.IO events for signaling. High-level events implemented by the server include:

- `join-room` — join a room
- `joined-room` — server confirms join
- `offer`, `answer` — SDP exchange
- `ice-candidate` — ICE candidate forwarding
- `call-user`, `incoming-call`, `call-accepted`, `call-rejected`, `call-ended` — call lifecycle

Refer to `backend/index.js` and `backend/socket/socketEvents.js` for specifics and payload shapes.

## Troubleshooting

- If peers fail to connect, check browser console for WebRTC/ICE errors and verify both peers have network connectivity to traverse NATs (consider STUN/TURN setup).
- If sockets fail to connect, confirm backend is running and CORS origin matches frontend origin.

## Contributing

Contributions are welcome. Open an issue or PR. Keep changes small and focused and add tests where appropriate.



