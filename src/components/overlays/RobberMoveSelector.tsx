/**
 * RobberMoveSelector Component
 *
 * Robber placement selection modal. Shows instructions for moving
 * the robber and provides visual feedback about valid hexes.
 * The actual hex selection happens on the game board, but this
 * modal provides context and shows available options.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import type { HexCoord } from '../../types/coordinates';
import type { PlayerColor } from '../../types/common';
import styles from './RobberMoveSelector.module.css';

export interface HexPlayerInfo {
  /** Hex coordinate */
  hex: HexCoord;
  /** Players with buildings adjacent to this hex */
  adjacentPlayers: {
    id: string;
    name: string;
    color: PlayerColor;
  }[];
  /** Resource type produced by this hex */
  resource?: string;
  /** Number token on this hex */
  number?: number;
}

export interface RobberMoveSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  /** List of valid hex coordinates where robber can be placed */
  validHexes: HexCoord[];
  /** Current robber location for reference */
  currentLocation?: HexCoord;
  /** Called when a hex is selected for robber placement */
  onSelect: (hex: HexCoord) => void;
  /** Time remaining in seconds */
  timeRemaining?: number;
  /** Whether friendly robber rule is enabled */
  friendlyRobberEnabled?: boolean;
  /** Additional hex info for display (optional) */
  hexInfo?: HexPlayerInfo[];
  /** Selected hex (if using confirm flow) */
  selectedHex?: HexCoord | null;
  /** Called when hex is clicked (for preview) */
  onHexHover?: (hex: HexCoord | null) => void;
  /** Whether to require confirmation before moving */
  requireConfirm?: boolean;
}

/**
 * RobberMoveSelector component for robber placement
 */
export const RobberMoveSelector: React.FC<RobberMoveSelectorProps> = ({
  isOpen,
  onClose,
  validHexes,
  currentLocation,
  onSelect,
  timeRemaining,
  friendlyRobberEnabled = false,
  hexInfo = [],
  selectedHex = null,
  onHexHover,
  requireConfirm = false,
}) => {
  const [localTime, setLocalTime] = useState(timeRemaining);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [internalSelectedHex, setInternalSelectedHex] = useState<HexCoord | null>(selectedHex);

  // Sync local time with prop
  useEffect(() => {
    setLocalTime(timeRemaining);
  }, [timeRemaining]);

  // Sync selected hex with prop
  useEffect(() => {
    setInternalSelectedHex(selectedHex);
  }, [selectedHex]);

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

  // Get info for hovered/selected hex
  const activeHexInfo = useMemo(() => {
    const targetHex = internalSelectedHex || hoveredHex;
    if (!targetHex) return null;
    return hexInfo.find(
      (info) => info.hex.q === targetHex.q && info.hex.r === targetHex.r
    );
  }, [hexInfo, hoveredHex, internalSelectedHex]);

  const handleHexClick = useCallback(
    (hex: HexCoord) => {
      if (requireConfirm) {
        setInternalSelectedHex(hex);
      } else {
        onSelect(hex);
      }
    },
    [requireConfirm, onSelect]
  );

  const handleConfirm = useCallback(() => {
    if (internalSelectedHex) {
      onSelect(internalSelectedHex);
    }
  }, [internalSelectedHex, onSelect]);

  const handleMouseEnter = useCallback(
    (hex: HexCoord) => {
      setHoveredHex(hex);
      onHexHover?.(hex);
    },
    [onHexHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredHex(null);
    onHexHover?.(null);
  }, [onHexHover]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move the Robber"
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

        {/* Robber Icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.robberIcon}
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="20" r="12" fill="#1a1a1a" />
            <ellipse cx="32" cy="48" rx="18" ry="12" fill="#1a1a1a" />
            <circle cx="28" cy="18" r="2" fill="#ffffff" />
            <circle cx="36" cy="18" r="2" fill="#ffffff" />
            <path
              d="M28 24 Q32 28 36 24"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>
            Click on a highlighted hex on the board to place the robber.
          </p>
          <p className={styles.subText}>
            The robber blocks resource production for all players on that hex.
            You may then steal a card from one adjacent player.
          </p>
        </div>

        {/* Friendly Robber Info */}
        {friendlyRobberEnabled && (
          <div className={styles.friendlyRobberInfo}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4fc3f7"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Friendly Robber: Cannot place on players with 2 or fewer victory points</span>
          </div>
        )}

        {/* Valid Hexes Count */}
        <div className={styles.hexCount}>
          <span className={styles.hexCountNumber}>{validHexes.length}</span>
          <span className={styles.hexCountLabel}>valid locations</span>
        </div>

        {/* Hex Preview (when hovered/selected) */}
        {activeHexInfo && (
          <div className={styles.hexPreview}>
            <div className={styles.hexPreviewHeader}>
              {activeHexInfo.resource && (
                <span className={styles.hexResource}>
                  {activeHexInfo.resource}
                </span>
              )}
              {activeHexInfo.number && (
                <span className={styles.hexNumber}>
                  #{activeHexInfo.number}
                </span>
              )}
            </div>
            {activeHexInfo.adjacentPlayers.length > 0 && (
              <div className={styles.adjacentPlayers}>
                <span className={styles.adjacentLabel}>Players to steal from:</span>
                <div className={styles.playerChips}>
                  {activeHexInfo.adjacentPlayers.map((player) => (
                    <span
                      key={player.id}
                      className={styles.playerChip}
                      style={{
                        '--player-color': getPlayerColorHex(player.color),
                      } as React.CSSProperties}
                    >
                      <span
                        className={styles.playerDot}
                        style={{ backgroundColor: getPlayerColorHex(player.color) }}
                      />
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {activeHexInfo.adjacentPlayers.length === 0 && (
              <span className={styles.noPlayers}>No adjacent players</span>
            )}
          </div>
        )}

        {/* Current Location */}
        {currentLocation && (
          <div className={styles.currentLocation}>
            Robber is currently at position ({currentLocation.q}, {currentLocation.r})
          </div>
        )}

        {/* Confirm Button (if using confirm flow) */}
        {requireConfirm && internalSelectedHex && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setInternalSelectedHex(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleConfirm}
            >
              Confirm Placement
            </button>
          </div>
        )}

        {/* Board Interaction Hint */}
        <div className={styles.boardHint}>
          <span>Board is highlighted</span>
        </div>
      </div>
    </Modal>
  );
};

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

export default RobberMoveSelector;
