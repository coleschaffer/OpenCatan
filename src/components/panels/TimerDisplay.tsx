import React, { useMemo } from 'react';
import styles from './TimerDisplay.module.css';

interface TimerDisplayProps {
  /** Time remaining in seconds */
  secondsRemaining: number;
  /** Whether it's the local player's turn */
  isMyTurn: boolean;
  /** Maximum time for the turn (for progress calculation) */
  maxSeconds?: number;
  /** Whether to show circular progress (default) or bar progress */
  variant?: 'circular' | 'bar';
  /** Size of the timer (for circular variant) */
  size?: 'small' | 'medium' | 'large';
}

/**
 * TimerDisplay - Turn timer component
 *
 * Displays the remaining time for a turn with visual progress.
 * Changes color when time is low (< 10s) and flashes when
 * critical (< 5s).
 *
 * @param secondsRemaining - Time left in seconds
 * @param isMyTurn - Whether it's the player's turn
 * @param maxSeconds - Maximum turn time
 * @param variant - Display variant (circular or bar)
 * @param size - Size of the display
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  secondsRemaining,
  isMyTurn,
  maxSeconds = 90,
  variant = 'circular',
  size = 'medium',
}) => {
  /**
   * Calculate progress percentage
   */
  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, (secondsRemaining / maxSeconds) * 100));
  }, [secondsRemaining, maxSeconds]);

  /**
   * Determine timer state
   */
  const isLow = secondsRemaining <= 10;
  const isCritical = secondsRemaining <= 5;

  /**
   * Format time for display
   */
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }, [secondsRemaining]);

  /**
   * Get size values
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
  const stateClass = isCritical
    ? styles.critical
    : isLow
      ? styles.low
      : styles.normal;

  if (variant === 'bar') {
    return (
      <div
        className={`${styles.timerBar} ${stateClass} ${isMyTurn ? styles.myTurn : ''}`}
      >
        <div className={styles.barLabel}>
          <span className={styles.barIcon}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
          </span>
          <span className={styles.barTime}>{formattedTime}</span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={styles.barProgress}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.timerCircular} ${stateClass} ${isMyTurn ? styles.myTurn : ''}`}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        className={styles.circleSvg}
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
      >
        {/* Background circle */}
        <circle
          className={styles.circleBackground}
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={styles.circleProgress}
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
      <span
        className={styles.circleTime}
        style={{ fontSize }}
      >
        {formattedTime}
      </span>
    </div>
  );
};

export default TimerDisplay;
