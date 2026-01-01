/**
 * SetupOverlay - Minimal status bar during setup phase
 *
 * Shows only essential info:
 * - Whose turn it is
 * - What to place (settlement/road)
 * - Timer
 */

import React from 'react';
import type { Player, PlayerColor, VertexCoord, EdgeCoord } from '../../types';
import { PLAYER_COLOR_HEX } from '../../types';
import styles from './setup.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SetupOverlayProps {
  /** All players in the game */
  players: Player[];
  /** Current player whose turn it is */
  currentPlayer: Player;
  /** Whether the local player is the current player */
  isMyTurn: boolean;
  /** Current placement type */
  placementType: 'settlement' | 'road';
  /** Which setup round (1 or 2) */
  setupRound: 1 | 2;
  /** Current placement index in setup order */
  placementIndex: number;
  /** Total placements needed */
  totalPlacements: number;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Valid settlement placements (when placing settlement) */
  validSettlements?: VertexCoord[];
  /** Valid road placements (when placing road) */
  validRoads?: EdgeCoord[];
  /** Callback when player places settlement */
  onPlaceSettlement?: (vertex: VertexCoord) => void;
  /** Callback when player places road */
  onPlaceRoad?: (edge: EdgeCoord) => void;
  /** Whether second settlement grants resources */
  isSecondSettlement?: boolean;
  /** Placements already made */
  completedPlacements?: Record<string, {
    settlement1: VertexCoord | null;
    road1: EdgeCoord | null;
    settlement2: VertexCoord | null;
    road2: EdgeCoord | null;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export const SetupOverlay: React.FC<SetupOverlayProps> = ({
  currentPlayer,
  isMyTurn,
  placementType,
  setupRound,
  timeRemaining,
  isSecondSettlement = false,
}) => {
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if timer is low
  const isTimerLow = timeRemaining <= 10;

  // Get current player color
  const playerColor = PLAYER_COLOR_HEX[currentPlayer.color as PlayerColor];

  // Get action text
  const actionText = placementType === 'settlement'
    ? `Place ${setupRound === 1 ? 'first' : 'second'} settlement`
    : 'Place road';

  return (
    <div className={styles.setupOverlayMinimal}>
      {/* Current turn and action */}
      <div className={styles.turnInfo}>
        <div
          className={styles.playerBadge}
          style={{ borderColor: playerColor, backgroundColor: `${playerColor}20` }}
        >
          <div
            className={styles.playerDotSmall}
            style={{ backgroundColor: playerColor }}
          />
          <span className={styles.turnText}>
            {isMyTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
          </span>
        </div>
        <span className={styles.actionText}>{actionText}</span>
      </div>

      {/* Timer */}
      <div className={`${styles.timerMinimal} ${isTimerLow ? styles.timerLow : ''}`}>
        {formatTime(timeRemaining)}
      </div>

      {/* Resource hint for second settlement */}
      {isMyTurn && isSecondSettlement && placementType === 'settlement' && (
        <div className={styles.resourceHintMinimal}>
          +Resources from adjacent tiles
        </div>
      )}
    </div>
  );
};

export default SetupOverlay;
