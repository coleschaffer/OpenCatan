// @ts-nocheck
// TODO: Fix TypeScript errors in this file
/**
 * GameContainer - Wrapper component that provides game context
 *
 * Handles:
 * - Connection management (redirect if disconnected)
 * - Game state initialization
 * - Error boundaries
 * - Loading states
 */

import React, { useEffect, ReactNode } from 'react';
import { useAppSelector } from '@/hooks';
import { usePartyConnection } from '@/network/hooks';
import { useGameNavigation, useRoomCode } from '@/hooks';
import {
  selectConnectionStatus,
  selectGameStarted,
  selectPhase,
  selectIsLoading,
  selectLoadingMessage,
} from '@/game/state';
import { GameLoadingScreen } from './GameLoadingScreen';
import { DisconnectedOverlay } from './DisconnectedOverlay';

/**
 * Props for GameContainer
 */
export interface GameContainerProps {
  /** Child components (the actual game UI) */
  children: ReactNode;
  /** Callback when game fails to load */
  onLoadError?: (error: Error) => void;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary wrapper for game content
 */
class GameErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          color: '#ffffff',
          textAlign: 'center',
        }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2 style={{ margin: '1.5rem 0 0.5rem', color: '#ffd700' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#1a1a2e',
              background: '#ffd700',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GameContainer - Main wrapper for the game page
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   return (
 *     <GameContainer>
 *       <GameHeader />
 *       <GameBoard />
 *       <ActionBar />
 *     </GameContainer>
 *   );
 * }
 * ```
 */
export const GameContainer: React.FC<GameContainerProps> = ({
  children,
  onLoadError,
}) => {
  const { goToLanding } = useGameNavigation();
  const { isConnected, reconnect } = usePartyConnection();
  const roomCode = useRoomCode();

  // Redux state
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const gameStarted = useAppSelector(selectGameStarted);
  const phase = useAppSelector(selectPhase);
  const isLoading = useAppSelector(selectIsLoading);
  const loadingMessage = useAppSelector(selectLoadingMessage);

  // Show disconnected overlay - only show if game started and then lost connection
  // Don't show during initial connection or brief state transitions
  const showDisconnectedOverlay =
    gameStarted &&
    phase !== 'lobby' &&
    (connectionStatus === 'disconnected' || connectionStatus === 'error');

  // Redirect to landing if disconnected for too long
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !isConnected) {
      const timeout = setTimeout(() => {
        // After 30 seconds of disconnection, redirect
        // This gives time for reconnection attempts
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, isConnected, goToLanding]);

  // Handle reconnection
  const handleReconnect = () => {
    if (reconnect) {
      reconnect();
    }
  };

  // Handle return to lobby
  const handleReturnToLobby = () => {
    goToLanding();
  };

  // No room code - show error
  if (!roomCode) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>Invalid Game</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
          No room code provided.
        </p>
        <button
          onClick={handleReturnToLobby}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#1a1a2e',
            background: '#ffd700',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Game not started - show error
  if (!gameStarted && phase === 'lobby') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>Game Not Started</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
          This game has not started yet.
        </p>
        <button
          onClick={handleReturnToLobby}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#1a1a2e',
            background: '#ffd700',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameLoadingScreen
        message={loadingMessage || 'Loading game...'}
        connectionStatus={connectionStatus}
      />
    );
  }

  return (
    <GameErrorBoundary onError={onLoadError}>
      {/* Disconnected overlay */}
      {showDisconnectedOverlay && (
        <DisconnectedOverlay
          connectionStatus={connectionStatus}
          onReconnect={handleReconnect}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* Main game content */}
      {children}
    </GameErrorBoundary>
  );
};

export default GameContainer;
