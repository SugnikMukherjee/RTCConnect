import React from 'react';
import { VideoCallProvider } from './context/VideoCallContext';
import { useVideoCall } from './context/VideoCallContext';
import JoinRoom from './components/JoinRoom';
import VideoCall from './components/VideoCall';
import './App.css';

// Inner component that uses the context
const AppContent: React.FC = () => {
  const { currentUser } = useVideoCall();

  return (
    <div className="App">
      {currentUser ? <VideoCall /> : <JoinRoom />}
    </div>
  );
};

// Main App component with context provider
const App: React.FC = () => {
  return (
    <VideoCallProvider>
      <AppContent />
    </VideoCallProvider>
  );
};

export default App;
