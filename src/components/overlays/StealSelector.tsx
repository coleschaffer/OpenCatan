import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import type { PlayerColor } from '../../types';
import styles from './StealSelector.module.css';

export interface StealVictim {
  id: string;
  name: string;
  color: PlayerColor;
  /** Number of resource cards in hand */
  cardCount: number;
}

export interface StealSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  /** List of potential victims to steal from */
  victims: StealVictim[];
  /** Called when a victim is selected */
  onSelect: (playerId: string) => void;
  /** Time remaining in seconds */
  timeRemaining?: number;
}

/**
 * Get hex color for player color
 */
function getPlayerColorHex(color: PlayerColor): string {
  const colors: Record<PlayerColor, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    orange: '#fb8c00',
    white: '#f5f5f5',
    green: '#43a047',
    purple: '#8e24aa',
    black: '#424242',
    bronze: '#a1887f',
    gold: '#ffd700',
    silver: '#b0bec5',
    pink: '#ec407a',
    mysticblue: '#4fc3f7',
  };
  return colors[color] || '#888888';
}

/**
 * StealSelector component for choosing which player to steal from
 * after placing the robber.
 */
export const StealSelector: React.FC<StealSelectorProps> = ({
  isOpen,
  onClose,
  victims,
  onSelect,
  timeRemaining,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState(timeRemaining);

  // Sync local time with prop
  useEffect(() => {
    setLocalTime(timeRemaining);
  }, [timeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || localTime === undefined || localTime <= 0) return;

    const timer = setInterval(() => {
      setLocalTime((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, localTime]);

  // Timer display
  const timerDisplay = useMemo(() => {
    if (localTime === undefined) return null;
    const minutes = Math.floor(localTime / 60);
    const seconds = localTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [localTime]);

  const isTimerWarning = localTime !== undefined && localTime <= 10;

  const handleSelect = useCallback(
    (playerId: string) => {
      onSelect(playerId);
    },
    [onSelect]
  );

  // If there's only one victim, we could auto-select, but let's show the modal anyway
  // for clarity and consistency

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Steal a Card"
      size="small"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className={styles.container}>
        {/* Timer */}
        {timerDisplay && (
          <div className={`${styles.timer} ${isTimerWarning ? styles.timerWarning : ''}`}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timerDisplay}</span>
          </div>
        )}

        {/* Instructions */}
        <p className={styles.instructions}>
          Choose a player to steal one random resource card from:
        </p>

        {/* Victims List */}
        {victims.length === 0 ? (
          <div className={styles.noVictims}>
            <p>No players have any cards to steal.</p>
            <button
              type="button"
              className={styles.skipButton}
              onClick={onClose}
            >
              Continue
            </button>
          </div>
        ) : (
          <div className={styles.victimsList}>
            {victims.map((victim) => {
              const colorHex = getPlayerColorHex(victim.color);
              const isHovered = hoveredId === victim.id;

              return (
                <button
                  key={victim.id}
                  type="button"
                  className={`${styles.victimButton} ${isHovered ? styles.victimButtonHovered : ''}`}
                  onClick={() => handleSelect(victim.id)}
                  onMouseEnter={() => setHoveredId(victim.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={
                    {
                      '--player-color': colorHex,
                      borderColor: isHovered ? colorHex : undefined,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className={styles.playerColorBadge}
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className={styles.playerName}>{victim.name}</span>
                  <span className={styles.cardCount}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 12h6M12 9v6" />
                    </svg>
                    {victim.cardCount} card{victim.cardCount !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        {victims.length > 0 && (
          <p className={styles.hint}>
            You will steal one random card from the selected player.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default StealSelector;
