/**
 * AudioInitializer - Component to initialize audio on first user interaction
 *
 * The Web Audio API requires a user gesture (click, tap, keypress) before
 * creating an AudioContext. This component listens for the first interaction
 * and initializes the SoundManager.
 *
 * Usage: Place near the root of your app, renders nothing visible.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { soundManager } from './SoundManager';

interface AudioInitializerProps {
  /** Optional callback when audio is initialized */
  onInitialized?: () => void;
  /** Whether to show a visual indicator (for debugging) */
  showIndicator?: boolean;
}

/**
 * AudioInitializer component
 * Handles automatic audio context initialization on user interaction
 */
export const AudioInitializer: React.FC<AudioInitializerProps> = ({
  onInitialized,
  showIndicator = false,
}) => {
  const [isInitialized, setIsInitialized] = useState(soundManager.isInitialized());

  /**
   * Initialize audio on user interaction
   */
  const handleInteraction = useCallback(async () => {
    if (soundManager.isInitialized()) {
      return;
    }

    try {
      await soundManager.initialize();
      setIsInitialized(true);
      onInitialized?.();
    } catch (error) {
      console.error('AudioInitializer: Failed to initialize audio', error);
    }
  }, [onInitialized]);

  /**
   * Set up event listeners for user interaction
   */
  useEffect(() => {
    // Skip if already initialized
    if (soundManager.isInitialized()) {
      setIsInitialized(true);
      return;
    }

    // Events that count as user interaction for audio
    const events: (keyof WindowEventMap)[] = [
      'click',
      'touchstart',
      'keydown',
      'mousedown',
    ];

    // Add listeners
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: false, passive: true });
    });

    // Subscribe to SoundManager initialization state
    const unsubscribe = soundManager.onInitialized((initialized) => {
      setIsInitialized(initialized);
      if (initialized) {
        onInitialized?.();
      }
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
      unsubscribe();
    };
  }, [handleInteraction, onInitialized]);

  /**
   * Handle visibility change (pause/resume audio when tab is hidden/shown)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        soundManager.suspend();
      } else {
        soundManager.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show indicator for debugging if enabled
  if (showIndicator) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '8px',
          left: '8px',
          padding: '4px 8px',
          backgroundColor: isInitialized ? '#4caf50' : '#ff9800',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        Audio: {isInitialized ? 'Ready' : 'Click to enable'}
      </div>
    );
  }

  // Render nothing by default
  return null;
};

export default AudioInitializer;
