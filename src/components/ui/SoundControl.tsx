/**
 * SoundControl - Sound control UI component
 *
 * Provides a mute button with a volume slider that appears on hover/click.
 * Shows appropriate speaker icons based on volume level and mute state.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSound } from '@/hooks/useSound';
import styles from './SoundControl.module.css';

interface SoundControlProps {
  /** Optional custom class name */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show volume percentage label */
  showLabel?: boolean;
  /** Direction the slider expands */
  direction?: 'horizontal' | 'vertical';
  /** Whether to persist slider visibility on click */
  clickToToggle?: boolean;
}

/**
 * Speaker icon SVG - muted (with X)
 */
const SpeakerMutedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

/**
 * Speaker icon SVG - low volume
 */
const SpeakerLowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
  </svg>
);

/**
 * Speaker icon SVG - high volume
 */
const SpeakerHighIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

/**
 * SoundControl component
 */
export const SoundControl: React.FC<SoundControlProps> = ({
  className,
  size = 'medium',
  showLabel = false,
  direction = 'horizontal',
  clickToToggle = false,
}) => {
  const { soundEnabled, volume, setVolume, toggleSound, playClick } = useSound();
  const [showSlider, setShowSlider] = useState(false);
  const [sliderLocked, setSliderLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Get the appropriate speaker icon
   */
  const getSpeakerIcon = () => {
    if (!soundEnabled || volume === 0) {
      return <SpeakerMutedIcon className={styles.icon} />;
    }
    if (volume < 50) {
      return <SpeakerLowIcon className={styles.icon} />;
    }
    return <SpeakerHighIcon className={styles.icon} />;
  };

  /**
   * Handle mute button click
   */
  const handleMuteClick = useCallback(() => {
    if (clickToToggle) {
      setSliderLocked((prev) => !prev);
    } else {
      toggleSound();
      playClick();
    }
  }, [clickToToggle, toggleSound, playClick]);

  /**
   * Handle volume change
   */
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseInt(e.target.value, 10);
      setVolume(newVolume);
    },
    [setVolume]
  );

  /**
   * Handle mouse enter
   */
  const handleMouseEnter = useCallback(() => {
    setShowSlider(true);
  }, []);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    if (!sliderLocked) {
      setShowSlider(false);
    }
  }, [sliderLocked]);

  /**
   * Handle click outside to close slider
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSlider(false);
        setSliderLocked(false);
      }
    };

    if (sliderLocked) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sliderLocked]);

  /**
   * Get size class
   */
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'large':
        return styles.sizeLarge;
      default:
        return styles.sizeMedium;
    }
  };

  /**
   * Get direction class
   */
  const getDirectionClass = () => {
    return direction === 'vertical' ? styles.vertical : styles.horizontal;
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${getSizeClass()} ${getDirectionClass()} ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Mute button */}
      <button
        type="button"
        className={`${styles.muteButton} ${!soundEnabled ? styles.muted : ''}`}
        onClick={handleMuteClick}
        title={soundEnabled ? 'Mute' : 'Unmute'}
        aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
      >
        {getSpeakerIcon()}
      </button>

      {/* Volume slider */}
      <div
        className={`${styles.sliderContainer} ${showSlider || sliderLocked ? styles.visible : ''}`}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={soundEnabled ? volume : 0}
          onChange={handleVolumeChange}
          className={styles.slider}
          aria-label="Volume"
        />
        {showLabel && (
          <span className={styles.volumeLabel}>
            {soundEnabled ? `${volume}%` : 'Muted'}
          </span>
        )}
      </div>

      {/* Click-to-toggle mute (for horizontal layout with slider) */}
      {clickToToggle && (showSlider || sliderLocked) && (
        <button
          type="button"
          className={styles.toggleMuteButton}
          onClick={() => {
            toggleSound();
            playClick();
          }}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? 'Mute' : 'Unmute'}
        </button>
      )}
    </div>
  );
};

export default SoundControl;
