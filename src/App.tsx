/**
 * App - Main application component with routing
 *
 * Sets up React Router for the OpenCatan application flow:
 * Landing -> Create/Join -> Lobby -> Game
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  LandingPage,
  CreateRoomPage,
  JoinRoomPage,
  LobbyPage,
  GamePage,
  RoomPage,
} from '@/pages';
import { AudioInitializer } from '@/audio';
import './App.css';

/**
 * NotFound - 404 fallback component
 */
function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/">Return to Home</a>
    </div>
  );
}

/**
 * Main App component with routing configuration
 *
 * Routes:
 * - /              Landing page (create or join)
 * - /create        Create a new room
 * - /join          Join a room (enter code)
 * - /join/:code    Join with pre-filled code (direct link)
 * - /:code         Room (lobby or game) - 1-6 letter codes only
 */
function App() {
  return (
    <BrowserRouter>
      {/* Initialize audio system on first user interaction */}
      <AudioInitializer />
      <div className="app">
        <Routes>
          {/* Landing page - Create or Join */}
          <Route path="/" element={<LandingPage />} />

          {/* Create room */}
          <Route path="/create" element={<CreateRoomPage />} />

          {/* Join room - without code */}
          <Route path="/join" element={<JoinRoomPage />} />

          {/* Join room - with code from URL */}
          <Route path="/join/:code" element={<JoinRoomPage />} />

          {/* Room (lobby or game) - handles 1-6 letter codes */}
          <Route path="/:code" element={<RoomPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
