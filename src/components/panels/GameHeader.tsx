import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectRoomCode, selectConnectionStatus } from '@/game/state/slices/lobbySlice';
import { selectGameSettings } from '@/game/state/slices/gameSlice';
import styles from './panels.module.css';

interface GameHeaderProps {
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Current sound volume (0-100) */
  volume?: number;
  /** Whether sound is muted */
  isMuted?: boolean;
  /** Callback when volume changes */
  onVolumeChange?: (volume: number) => void;
  /** Callback when mute is toggled */
  onMuteToggle?: () => void;
  /** Whether currently in fullscreen */
  isFullscreen?: boolean;
  /** Callback when fullscreen is toggled */
  onFullscreenToggle?: () => void;
}

/**
 * GameHeader - Top bar component for the game UI
 *
 * Displays:
 * - OpenCatan logo/title
 * - Room code
 * - Settings button
 * - Sound toggle with volume
 * - Fullscreen toggle
 * - Connection status indicator
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  onSettingsClick,
  volume = 80,
  isMuted = false,
  onVolumeChange,
  onMuteToggle,
  isFullscreen = false,
  onFullscreenToggle,
}) => {
  const roomCode = useSelector(selectRoomCode);
  const connectionStatus = useSelector(selectConnectionStatus);
  const settings = useSelector(selectGameSettings);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  /**
   * Handle copying room code to clipboard
   */
  const handleCopyRoomCode = useCallback(async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        // Could trigger a toast notification here
      } catch (err) {
        console.error('Failed to copy room code:', err);
      }
    }
  }, [roomCode]);

  /**
   * Get connection status class
   */
  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return styles.connectionConnected;
      case 'connecting':
        return styles.connectionConnecting;
      case 'disconnected':
      case 'error':
        return styles.connectionDisconnected;
      default:
        return '';
    }
  };

  /**
   * Get connection status text
   */
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get game mode display text
   */
  const getGameModeText = () => {
    switch (settings.mode) {
      case 'base':
        return 'Classic';
      case 'cities-knights':
        return 'Cities & Knights';
      case 'seafarers':
        return 'Seafarers';
      case 'cities-knights-5-6':
        return 'C&K 5-6';
      default:
        return settings.mode;
    }
  };

  return (
    <header className={styles.gameHeader}>
      {/* Logo and title section */}
      <div className={styles.headerLeft}>
        <div className={styles.logo}>
          <svg viewBox="0 0 32 32" width="28" height="28" className={styles.logoIcon}>
            <polygon
              points="16,2 28,10 28,22 16,30 4,22 4,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <polygon
              points="16,8 22,12 22,20 16,24 10,20 10,12"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
          <span className={styles.logoText}>OpenCatan</span>
        </div>

        {/* Game mode badge */}
        <span className={styles.gameModeBadge}>{getGameModeText()}</span>
      </div>

      {/* Center section - Room code */}
      <div className={styles.headerCenter}>
        {roomCode && (
          <button
            className={styles.roomCodeButton}
            onClick={handleCopyRoomCode}
            title="Click to copy room code"
          >
            <span className={styles.roomCodeLabel}>Room:</span>
            <span className={styles.roomCodeValue}>{roomCode}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
          </button>
        )}

        {/* Connection status */}
        <div className={`${styles.connectionStatus} ${getConnectionStatusClass()}`}>
          <span className={styles.connectionDot} />
          <span className={styles.connectionText}>{getConnectionStatusText()}</span>
        </div>
      </div>

      {/* Right section - Controls */}
      <div className={styles.headerRight}>
        {/* Sound controls */}
        <div
          className={styles.volumeControl}
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            className={styles.headerButton}
            onClick={onMuteToggle}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : volume < 50 ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {/* Volume slider */}
          {showVolumeSlider && (
            <div className={styles.volumeSliderContainer}>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange?.(parseInt(e.target.value, 10))}
                className={styles.volumeSlider}
              />
              <span className={styles.volumeValue}>{isMuted ? 0 : volume}%</span>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          className={styles.headerButton}
          onClick={onSettingsClick}
          title="Settings"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </svg>
        </button>

        {/* Fullscreen button */}
        <button
          className={styles.headerButton}
          onClick={onFullscreenToggle}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default GameHeader;
