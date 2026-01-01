/**
 * GameLoadingScreen - Loading screen while game initializes
 *
 * Displays:
 * - Spinner/animation
 * - "Loading game..." message
 * - Connection status
 */

import React from 'react';

/**
 * Props for GameLoadingScreen
 */
export interface GameLoadingScreenProps {
  /** Loading message to display */
  message?: string;
  /** Current connection status */
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Optional progress percentage (0-100) */
  progress?: number;
}

/**
 * GameLoadingScreen component
 *
 * @example
 * ```tsx
 * <GameLoadingScreen
 *   message="Loading game..."
 *   connectionStatus="connecting"
 * />
 * ```
 */
export const GameLoadingScreen: React.FC<GameLoadingScreenProps> = ({
  message = 'Loading game...',
  connectionStatus = 'connecting',
  progress,
}) => {
  // Get connection status display
  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'Connected', color: '#22c55e' };
      case 'connecting':
        return { text: 'Connecting...', color: '#eab308' };
      case 'disconnected':
        return { text: 'Disconnected', color: '#ef4444' };
      case 'error':
        return { text: 'Connection Error', color: '#ef4444' };
      default:
        return { text: 'Unknown', color: '#6b7280' };
    }
  };

  const connectionDisplay = getConnectionDisplay();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        color: '#ffffff',
        textAlign: 'center',
      }}
    >
      {/* Animated hexagon spinner */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          marginBottom: '2rem',
        }}
      >
        {/* Outer rotating hexagon */}
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            animation: 'spin 3s linear infinite',
          }}
        >
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ff8c00" />
            </linearGradient>
          </defs>
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="2"
            opacity="0.3"
          />
        </svg>

        {/* Inner pulsing hexagon */}
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <polygon
            points="50,20 75,35 75,65 50,80 25,65 25,35"
            fill="none"
            stroke="#ffd700"
            strokeWidth="3"
          />
        </svg>

        {/* Center dot */}
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="#ffd700"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        </svg>
      </div>

      {/* Loading message */}
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffd700',
          margin: '0 0 1rem',
        }}
      >
        {message}
      </h2>

      {/* Progress bar (if provided) */}
      {progress !== undefined && (
        <div
          style={{
            width: '200px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Connection status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connectionDisplay.color,
            animation: connectionStatus === 'connecting' ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />
        <span>{connectionDisplay.text}</span>
      </div>

      {/* Loading tips */}
      <p
        style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: '400px',
        }}
      >
        Tip: Trade often with other players for the best chance of winning!
      </p>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default GameLoadingScreen;
