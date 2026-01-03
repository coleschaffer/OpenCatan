import React, { useState, useEffect, useCallback } from 'react';
import styles from './DiceDisplay.module.css';

/**
 * Event die values for Cities & Knights
 */
export type EventDieValue = 'barbarian' | 'trade' | 'politics' | 'science' | null;

interface DiceDisplayProps {
  /** Value of the first die (1-6) */
  die1: number | null;
  /** Value of the second die (1-6) */
  die2: number | null;
  /** Total of both dice (optional, for display purposes) */
  total?: number;
  /** Whether dice are currently rolling */
  isRolling?: boolean;
  /** Event die result for Cities & Knights */
  eventDie?: EventDieValue;
  /** Whether to animate the dice rolling */
  animate?: boolean;
  /** Auto-hide delay in milliseconds (0 = never hide) */
  autoHideDelay?: number;
  /** Callback when dice finish animating */
  onAnimationComplete?: () => void;
  /** Callback when dice are hidden */
  onHidden?: () => void;
}

/**
 * Event die icons
 */
const eventDieIcons: Record<Exclude<EventDieValue, null>, string> = {
  barbarian: '⚔️',
  trade: '🪙',
  politics: '📜',
  science: '⚗️',
};

/**
 * Event die colors
 */
const eventDieColors: Record<Exclude<EventDieValue, null>, string> = {
  barbarian: '#d32f2f',
  trade: '#ffd700',
  politics: '#1565c0',
  science: '#2e7d32',
};

/**
 * Dice face dots configuration
 * Each number maps to an array of positions (1-9 on a 3x3 grid)
 */
const diceDots: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

/**
 * DiceDisplay - Dice roll result component
 *
 * Displays dice roll results with optional animation.
 * Supports Cities & Knights event die.
 * Auto-hides after a configurable delay.
 *
 * @param die1 - First die value
 * @param die2 - Second die value
 * @param eventDie - Event die result (C&K)
 * @param animate - Whether to animate
 * @param autoHideDelay - Auto-hide delay in ms
 * @param onAnimationComplete - Animation complete callback
 * @param onHidden - Hidden callback
 */
export const DiceDisplay: React.FC<DiceDisplayProps> = ({
  die1,
  die2,
  total: _total,
  isRolling: _isRolling,
  eventDie,
  animate = true,
  autoHideDelay = 0, // Changed default to 0 (never hide) - dice always visible
  onAnimationComplete,
  onHidden,
}) => {
  // Suppress unused variable warnings
  void _total;
  void _isRolling;
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [displayValues, setDisplayValues] = useState<{ die1: number; die2: number }>({
    die1: 1,
    die2: 1,
  });

  /**
   * Handle dice animation
   */
  const animateDice = useCallback(() => {
    if (!animate || die1 === null || die2 === null) {
      if (die1 !== null && die2 !== null) {
        setDisplayValues({ die1, die2 });
        setIsVisible(true);
      }
      return;
    }

    setIsAnimating(true);
    setIsVisible(true);

    // Animate through random values
    const animationDuration = 400;
    const frameInterval = 50;
    let elapsed = 0;

    const animationInterval = setInterval(() => {
      elapsed += frameInterval;

      if (elapsed >= animationDuration) {
        clearInterval(animationInterval);
        setDisplayValues({ die1, die2 });
        setIsAnimating(false);
        onAnimationComplete?.();
      } else {
        // Random intermediate values
        setDisplayValues({
          die1: Math.floor(Math.random() * 6) + 1,
          die2: Math.floor(Math.random() * 6) + 1,
        });
      }
    }, frameInterval);

    return () => clearInterval(animationInterval);
  }, [die1, die2, animate, onAnimationComplete]);

  /**
   * Handle auto-hide
   */
  useEffect(() => {
    if (!isVisible || isAnimating || autoHideDelay === 0) return;

    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      onHidden?.();
    }, autoHideDelay);

    return () => clearTimeout(hideTimeout);
  }, [isVisible, isAnimating, autoHideDelay, onHidden]);

  /**
   * Trigger animation when dice values change
   */
  useEffect(() => {
    if (die1 !== null && die2 !== null) {
      animateDice();
    }
  }, [die1, die2, animateDice]);

  /**
   * Render dice face with dots
   */
  const renderDiceFace = (value: number) => {
    const dots = diceDots[value] || [];

    return (
      <div className={styles.diceFace}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((position) => (
          <div
            key={position}
            className={`${styles.dotPosition} ${dots.includes(position) ? styles.dot : ''}`}
          />
        ))}
      </div>
    );
  };

  if (die1 === null || die2 === null || !isVisible) {
    return null;
  }


  return (
    <div className={`${styles.diceDisplay} ${isAnimating ? styles.animating : ''}`}>
      <div className={styles.diceContainer}>
        {/* First die - only show face, no number */}
        <div className={styles.die}>
          {renderDiceFace(displayValues.die1)}
        </div>

        {/* Second die - only show face, no number */}
        <div className={styles.die}>
          {renderDiceFace(displayValues.die2)}
        </div>

        {/* Event die for C&K */}
        {eventDie && (
          <div
            className={styles.eventDie}
            style={{ '--event-color': eventDieColors[eventDie] } as React.CSSProperties}
          >
            <span className={styles.eventIcon}>{eventDieIcons[eventDie]}</span>
            <span className={styles.eventLabel}>
              {eventDie.charAt(0).toUpperCase() + eventDie.slice(1)}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default DiceDisplay;
