import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectTurnTimeRemaining, selectGameSettings } from '@/game/state/slices/gameSlice';
import styles from './panels.module.css';

interface TurnTimerProps {
  /** Whether it's the local player's turn */
  isMyTurn: boolean;
  /** Display variant: 'circular' for circular progress, 'bar' for horizontal bar */
  variant?: 'circular' | 'bar' | 'compact';
  /** Size of the timer display */
  size?: 'small' | 'medium' | 'large';
  /** Optional className for additional styling */
  className?: string;
}

/**
 * TurnTimer - Turn countdown display component
 *
 * Features:
 * - Circular or bar progress visualization
 * - Shows seconds remaining
 * - Color changes as time runs low (yellow < 30s, red < 10s)
 * - Pulses when very low
 */
export const TurnTimer: React.FC<TurnTimerProps> = ({
  isMyTurn,
  variant = 'circular',
  size = 'medium',
  className,
}) => {
  const turnTimeRemaining = useSelector(selectTurnTimeRemaining);
  const settings = useSelector(selectGameSettings);
  const maxSeconds = settings.turnTimer || 90;

  /**
   * Calculate progress percentage
   */
  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, (turnTimeRemaining / maxSeconds) * 100));
  }, [turnTimeRemaining, maxSeconds]);

  /**
   * Determine timer state
   */
  const isLow = turnTimeRemaining <= 30;
  const isCritical = turnTimeRemaining <= 10;
  const isUrgent = turnTimeRemaining <= 5;

  /**
   * Format time for display
   */
  const formattedTime = useMemo(() => {
    const mins = Math.floor(turnTimeRemaining / 60);
    const secs = turnTimeRemaining % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }, [turnTimeRemaining]);

  /**
   * Get size configuration
   */
  const sizeConfig = {
    small: { dimension: 48, strokeWidth: 4, fontSize: 12 },
    medium: { dimension: 64, strokeWidth: 5, fontSize: 16 },
    large: { dimension: 80, strokeWidth: 6, fontSize: 20 },
  };

  const { dimension, strokeWidth, fontSize } = sizeConfig[size];

  /**
   * Calculate SVG circle values
   */
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  /**
   * Get state class name
   */
  const getStateClass = () => {
    if (isUrgent) return styles.timerUrgent;
    if (isCritical) return styles.timerCritical;
    if (isLow) return styles.timerLow;
    return styles.timerNormal;
  };

  // Compact variant - just shows time text
  if (variant === 'compact') {
    return (
      <div
        className={`${styles.timerCompact} ${getStateClass()} ${isMyTurn ? styles.timerMyTurn : ''} ${className || ''}`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
        <span className={styles.timerCompactTime}>{formattedTime}</span>
      </div>
    );
  }

  // Bar variant
  if (variant === 'bar') {
    return (
      <div
        className={`${styles.timerBar} ${getStateClass()} ${isMyTurn ? styles.timerMyTurn : ''} ${className || ''}`}
      >
        <div className={styles.timerBarHeader}>
          <span className={styles.timerBarIcon}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
          </span>
          <span className={styles.timerBarTime}>{formattedTime}</span>
        </div>
        <div className={styles.timerBarTrack}>
          <div
            className={styles.timerBarProgress}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Circular variant (default)
  return (
    <div
      className={`${styles.timerCircular} ${getStateClass()} ${isMyTurn ? styles.timerMyTurn : ''} ${className || ''}`}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        className={styles.timerCircleSvg}
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
      >
        {/* Background circle */}
        <circle
          className={styles.timerCircleBackground}
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={styles.timerCircleProgress}
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
        />
      </svg>
      <span className={styles.timerCircleTime} style={{ fontSize }}>
        {formattedTime}
      </span>
    </div>
  );
};

export default TurnTimer;
