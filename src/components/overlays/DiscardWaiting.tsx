/**
 * DiscardWaiting Component
 *
 * Shown while waiting for other players to discard their cards
 * after a 7 is rolled. Displays a list of players who still need
 * to discard with their card counts and completion status.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import type { PlayerColor } from '../../types/common';
import styles from './DiscardWaiting.module.css';

export interface PlayerDiscardInfo {
  id: string;
  name: string;
  color: PlayerColor;
  /** Total cards in hand */
  cardCount: number;
  /** How many cards they need to discard */
  discardRequired: number;
  /** Whether they have completed discarding */
  hasDiscarded: boolean;
}

export interface DiscardWaitingProps {
  isOpen: boolean;
  onClose: () => void;
  /** Players who need to discard */
  playersNeedingDiscard: PlayerDiscardInfo[];
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
 * DiscardWaiting component shows waiting status while other players discard
 */
export const DiscardWaiting: React.FC<DiscardWaitingProps> = ({
  isOpen,
  onClose,
  playersNeedingDiscard,
  timeRemaining,
}) => {
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

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const players = playersNeedingDiscard || [];
    const total = players.length;
    const completed = players.filter((p) => p.hasDiscarded).length;
    const remaining = total - completed;
    return { total, completed, remaining };
  }, [playersNeedingDiscard]);

  // Timer display
  const timerDisplay = useMemo(() => {
    if (localTime === undefined) return null;
    const minutes = Math.floor(localTime / 60);
    const seconds = localTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [localTime]);

  const isTimerWarning = localTime !== undefined && localTime <= 10;

  // Check if all players have discarded
  const allComplete = completionStats.remaining === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Waiting for Discards"
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
            {isTimerWarning && (
              <span className={styles.timerWarnText}>Auto-discard soon!</span>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>A 7 was rolled!</p>
          <p className={styles.subText}>
            Waiting for {completionStats.remaining} player
            {completionStats.remaining !== 1 ? 's' : ''} to discard...
          </p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{
              width: `${(completionStats.completed / completionStats.total) * 100}%`,
            }}
          />
          <span className={styles.progressText}>
            {completionStats.completed} / {completionStats.total} complete
          </span>
        </div>

        {/* Players List */}
        <div className={styles.playersList}>
          {playersNeedingDiscard.map((player) => {
            const colorHex = getPlayerColorHex(player.color);
            const isComplete = player.hasDiscarded;

            return (
              <div
                key={player.id}
                className={`${styles.playerRow} ${isComplete ? styles.playerRowComplete : ''}`}
              >
                <span
                  className={styles.playerColorBadge}
                  style={{ backgroundColor: colorHex }}
                />
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.discardInfo}>
                  {isComplete ? (
                    <span className={styles.discardComplete}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Done
                    </span>
                  ) : (
                    <span className={styles.discardPending}>
                      Discarding {player.discardRequired}...
                    </span>
                  )}
                </span>
                <span className={styles.cardCount}>
                  {player.cardCount} cards
                </span>
              </div>
            );
          })}
        </div>

        {/* All Complete Message */}
        {allComplete && (
          <div className={styles.allComplete}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4caf50"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>All players have discarded!</span>
          </div>
        )}

        {/* Info text */}
        <p className={styles.infoText}>
          Players with more than 7 cards must discard half (rounded down).
        </p>
      </div>
    </Modal>
  );
};

export default DiscardWaiting;
