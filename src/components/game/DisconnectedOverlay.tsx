/**
 * DisconnectedOverlay - Shown when connection to game server is lost
 *
 * Displays:
 * - "Connection lost" message
 * - "Reconnecting..." with spinner
 * - Manual reconnect button
 * - Return to lobby option
 */

import React, { useState, useEffect } from 'react';

/**
 * Props for DisconnectedOverlay
 */
export interface DisconnectedOverlayProps {
  /** Current connection status */
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Callback to attempt reconnection */
  onReconnect: () => void;
  /** Callback to return to lobby */
  onReturnToLobby: () => void;
  /** Whether currently attempting to reconnect */
  isReconnecting?: boolean;
  /** Number of reconnection attempts made */
  reconnectAttempts?: number;
}

/**
 * DisconnectedOverlay component
 *
 * @example
 * ```tsx
 * {showDisconnected && (
 *   <DisconnectedOverlay
 *     connectionStatus="disconnected"
 *     onReconnect={handleReconnect}
 *     onReturnToLobby={goToLanding}
 *   />
 * )}
 * ```
 */
export const DisconnectedOverlay: React.FC<DisconnectedOverlayProps> = ({
  connectionStatus,
  onReconnect,
  onReturnToLobby,
  isReconnecting = false,
  reconnectAttempts = 0,
}) => {
  const [autoReconnecting, setAutoReconnecting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Auto-reconnect countdown
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !autoReconnecting) {
      setAutoReconnecting(true);
      setCountdown(5);
    }
  }, [connectionStatus, autoReconnecting]);

  useEffect(() => {
    if (autoReconnecting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoReconnecting && countdown === 0) {
      setAutoReconnecting(false);
      onReconnect();
    }
  }, [autoReconnecting, countdown, onReconnect]);

  // Get status message and icon
  const getStatusDisplay = () => {
    if (connectionStatus === 'error') {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the game server.',
        icon: 'error',
        color: '#ef4444',
      };
    }
    if (isReconnecting || autoReconnecting) {
      return {
        title: 'Reconnecting...',
        message: autoReconnecting
          ? `Attempting to reconnect in ${countdown}s`
          : 'Please wait while we reconnect you to the game.',
        icon: 'spinner',
        color: '#eab308',
      };
    }
    return {
      title: 'Connection Lost',
      message: 'Your connection to the game server was interrupted.',
      icon: 'warning',
      color: '#f97316',
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          borderRadius: '1rem',
          padding: '2.5rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Status icon */}
        <div
          style={{
            marginBottom: '1.5rem',
          }}
        >
          {statusDisplay.icon === 'spinner' ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: '#ffd700',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : statusDisplay.icon === 'error' ? (
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke={statusDisplay.color}
              strokeWidth="2"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : (
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke={statusDisplay.color}
              strokeWidth="2"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>

        {/* Status title */}
        <h2
          style={{
            color: '#ffd700',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 0.5rem',
          }}
        >
          {statusDisplay.title}
        </h2>

        {/* Status message */}
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            margin: '0 0 1.5rem',
            lineHeight: '1.5',
          }}
        >
          {statusDisplay.message}
        </p>

        {/* Reconnect attempts counter */}
        {reconnectAttempts > 0 && (
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem',
              margin: '0 0 1.5rem',
            }}
          >
            Reconnection attempts: {reconnectAttempts}
          </p>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Reconnect button */}
          <button
            onClick={() => {
              setAutoReconnecting(false);
              onReconnect();
            }}
            disabled={isReconnecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a2e',
              background: '#ffd700',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isReconnecting ? 'not-allowed' : 'pointer',
              opacity: isReconnecting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isReconnecting ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(26, 26, 46, 0.3)',
                    borderTopColor: '#1a1a2e',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Reconnecting...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Reconnect Now
              </>
            )}
          </button>

          {/* Return to lobby button */}
          <button
            onClick={onReturnToLobby}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Return to Lobby
          </button>
        </div>

        {/* Cancel auto-reconnect */}
        {autoReconnecting && (
          <button
            onClick={() => setAutoReconnecting(false)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Cancel auto-reconnect
          </button>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DisconnectedOverlay;
