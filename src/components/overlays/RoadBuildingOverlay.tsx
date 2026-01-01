/**
 * RoadBuildingOverlay Component
 *
 * Overlay for the Road Building development card flow.
 * Allows placing 2 roads for free with visual counter.
 * Can place fewer if no valid spots remain.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import type { EdgeCoord } from '../../types/coordinates';
import styles from './RoadBuildingOverlay.module.css';

export interface RoadBuildingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Number of roads already placed (0-2) */
  roadsPlaced: number;
  /** Maximum roads that can be placed (usually 2, less if no valid spots) */
  maxRoads: number;
  /** Number of valid edge positions remaining */
  validEdgesCount: number;
  /** Called when a road is placed (board interaction) */
  onRoadPlaced?: (edge: EdgeCoord) => void;
  /** Called when player confirms completion (early or after 2) */
  onComplete: () => void;
  /** Called if player wants to cancel (if allowed) */
  onCancel?: () => void;
  /** Whether player can cancel the action */
  canCancel?: boolean;
  /** Time remaining */
  timeRemaining?: number;
}

/**
 * RoadBuildingOverlay handles Road Building card placement
 */
export const RoadBuildingOverlay: React.FC<RoadBuildingOverlayProps> = ({
  isOpen,
  onClose,
  roadsPlaced,
  maxRoads,
  validEdgesCount,
  onRoadPlaced,
  onComplete,
  onCancel,
  canCancel = false,
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

  // Timer display
  const timerDisplay = useMemo(() => {
    if (localTime === undefined) return null;
    const minutes = Math.floor(localTime / 60);
    const seconds = localTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [localTime]);

  const isTimerWarning = localTime !== undefined && localTime <= 10;

  // Calculate remaining roads
  const roadsRemaining = maxRoads - roadsPlaced;
  const isComplete = roadsRemaining === 0 || validEdgesCount === 0;

  // Progress percentage
  const progressPercent = (roadsPlaced / maxRoads) * 100;

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleCancel = useCallback(() => {
    if (canCancel && onCancel) {
      onCancel();
    }
  }, [canCancel, onCancel]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Road Building"
      size="small"
      closeOnBackdropClick={canCancel}
      closeOnEscape={canCancel}
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

        {/* Card Icon */}
        <div className={styles.cardIcon}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
            <path d="M4 19h16M4 19l3-3M4 19l3 3" />
            <path d="M20 5H4M20 5l-3-3M20 5l-3 3" />
            <line x1="12" y1="5" x2="12" y2="19" />
          </svg>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>Place 2 roads for free!</p>
          <p className={styles.subText}>
            Click on highlighted edges on the board to place your roads.
          </p>
        </div>

        {/* Progress Counter */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressLabels}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`${styles.progressStep} ${
                  i < roadsPlaced ? styles.progressStepComplete : ''
                } ${i === roadsPlaced && i < maxRoads ? styles.progressStepActive : ''}`}
              >
                {i < roadsPlaced ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Status Display */}
        <div className={styles.status}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Roads Placed:</span>
            <span className={styles.statusValue}>{roadsPlaced} / {maxRoads}</span>
          </div>
          {validEdgesCount > 0 && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Valid Spots:</span>
              <span className={styles.statusValue}>{validEdgesCount}</span>
            </div>
          )}
        </div>

        {/* No Valid Spots Warning */}
        {validEdgesCount === 0 && roadsPlaced < maxRoads && (
          <div className={styles.noSpotsWarning}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>No valid spots remaining. You may complete with fewer roads.</span>
          </div>
        )}

        {/* Board Hint */}
        {validEdgesCount > 0 && !isComplete && (
          <div className={styles.boardHint}>
            <span>Board is highlighted</span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {canCancel && roadsPlaced === 0 && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className={`${styles.completeButton} ${isComplete ? styles.completeButtonReady : ''}`}
            onClick={handleComplete}
            disabled={roadsPlaced === 0 && validEdgesCount > 0}
          >
            {isComplete
              ? 'Complete'
              : roadsPlaced > 0
                ? `Done (${roadsPlaced}/${maxRoads})`
                : 'Place a road first'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoadBuildingOverlay;
