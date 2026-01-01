/**
 * SetupTurnOrder - Visual turn order display for setup phase
 *
 * Shows:
 * - All players in setup order
 * - Highlights current player
 * - Shows checkmarks for completed placements
 * - Snake pattern visualization (1->2->3->4->4->3->2->1)
 */

import React, { useMemo } from 'react';
import type { Player, PlayerColor, VertexCoord, EdgeCoord } from '../../types';
import { PLAYER_COLOR_HEX, PLAYER_COLOR_NAMES } from '../../types';
import styles from './setup.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SetupTurnOrderProps {
  /** All players in the game */
  players: Player[];
  /** Current player's ID */
  currentPlayerId: string;
  /** Current placement index */
  placementIndex: number;
  /** Completed placements per player */
  completedPlacements?: Record<string, {
    settlement1: VertexCoord | null;
    road1: EdgeCoord | null;
    settlement2: VertexCoord | null;
    road2: EdgeCoord | null;
  }>;
}

interface TurnSlot {
  playerId: string;
  player: Player;
  round: 1 | 2;
  index: number;
  isSettlementDone: boolean;
  isRoadDone: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SetupTurnOrder: React.FC<SetupTurnOrderProps> = ({
  players,
  currentPlayerId,
  placementIndex,
  completedPlacements = {},
}) => {
  // Generate the snake draft turn order visualization
  const turnSlots = useMemo((): TurnSlot[] => {
    const slots: TurnSlot[] = [];

    // Round 1: Forward order
    players.forEach((player, index) => {
      const placements = completedPlacements[player.id];
      slots.push({
        playerId: player.id,
        player,
        round: 1,
        index,
        isSettlementDone: !!placements?.settlement1,
        isRoadDone: !!placements?.road1,
      });
    });

    // Round 2: Reverse order
    [...players].reverse().forEach((player, index) => {
      const placements = completedPlacements[player.id];
      slots.push({
        playerId: player.id,
        player,
        round: 2,
        index: players.length + index,
        isSettlementDone: !!placements?.settlement2,
        isRoadDone: !!placements?.road2,
      });
    });

    return slots;
  }, [players, completedPlacements]);

  // Calculate which turn slot is current
  const currentTurnIndex = Math.floor(placementIndex / 2);

  // Get player color
  const getPlayerColor = (color: PlayerColor): string => {
    return PLAYER_COLOR_HEX[color] || '#888';
  };

  // Check if a slot is complete
  const isSlotComplete = (slot: TurnSlot): boolean => {
    return slot.isSettlementDone && slot.isRoadDone;
  };

  // Check if a slot is in progress
  const isSlotInProgress = (slot: TurnSlot, slotIndex: number): boolean => {
    return slotIndex === currentTurnIndex && !isSlotComplete(slot);
  };

  return (
    <div className={styles.turnOrderContainer}>
      <h4 className={styles.turnOrderTitle}>Turn Order</h4>

      {/* Snake pattern description */}
      <div className={styles.snakeDescription}>
        <span className={styles.snakeLabel}>Snake Draft:</span>
        <span className={styles.snakePattern}>
          {players.map((_, i) => i + 1).join(' -> ')}
          {' -> '}
          {[...players.map((_, i) => i + 1)].reverse().join(' -> ')}
        </span>
      </div>

      {/* Round 1 */}
      <div className={styles.roundSection}>
        <div className={styles.roundHeader}>
          <span className={styles.roundLabel}>Round 1</span>
          <span className={styles.roundArrow}>Forward</span>
        </div>
        <div className={styles.turnRow}>
          {turnSlots
            .filter((slot) => slot.round === 1)
            .map((slot, idx) => {
              const slotIndex = idx;
              const isCurrent = isSlotInProgress(slot, slotIndex);
              const isComplete = isSlotComplete(slot);
              const isPending = slotIndex > currentTurnIndex;
              const playerColor = getPlayerColor(slot.player.color as PlayerColor);

              return (
                <div
                  key={`${slot.playerId}-1`}
                  className={`${styles.turnSlot} ${
                    isCurrent ? styles.current : ''
                  } ${isComplete ? styles.complete : ''} ${
                    isPending ? styles.pending : ''
                  }`}
                  style={{
                    borderColor: playerColor,
                    backgroundColor: isCurrent ? `${playerColor}20` : undefined,
                  }}
                >
                  {/* Player color indicator */}
                  <div
                    className={styles.playerDot}
                    style={{ backgroundColor: playerColor }}
                  />

                  {/* Player name */}
                  <span className={styles.slotPlayerName}>
                    {slot.player.name.substring(0, 8)}
                    {slot.player.name.length > 8 ? '...' : ''}
                  </span>

                  {/* Completion indicators */}
                  <div className={styles.completionIndicators}>
                    <div
                      className={`${styles.indicator} ${
                        slot.isSettlementDone ? styles.done : ''
                      }`}
                      title="Settlement"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L4 9v12h16V9l-8-6z" />
                      </svg>
                    </div>
                    <div
                      className={`${styles.indicator} ${
                        slot.isRoadDone ? styles.done : ''
                      }`}
                      title="Road"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="10" width="20" height="4" rx="1" />
                      </svg>
                    </div>
                  </div>

                  {/* Current turn indicator */}
                  {isCurrent && (
                    <div
                      className={styles.currentIndicator}
                      style={{ backgroundColor: playerColor }}
                    />
                  )}
                </div>
              );
            })}
          {/* Arrow showing direction */}
          <div className={styles.directionArrow}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Snake Turn Indicator */}
      <div className={styles.snakeTurn}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 7l-1.41 1.41L14.83 4.67V11h-2V4.67l-3.76 3.74L7.66 7l5.17-5.17a1 1 0 0 1 1.41 0L20 7z" />
          <path d="M4 17l1.41-1.41L9.17 19.33V13h2v6.33l3.76-3.74L16.34 17l-5.17 5.17a1 1 0 0 1-1.41 0L4 17z" />
        </svg>
      </div>

      {/* Round 2 */}
      <div className={styles.roundSection}>
        <div className={styles.roundHeader}>
          <span className={styles.roundLabel}>Round 2</span>
          <span className={styles.roundArrow}>Reverse</span>
        </div>
        <div className={styles.turnRow}>
          {/* Arrow showing direction (at start for reverse) */}
          <div className={styles.directionArrow}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l1.41 1.41L7.83 11H20v2H7.83l5.58 5.59L12 20l-8-8z" />
            </svg>
          </div>
          {turnSlots
            .filter((slot) => slot.round === 2)
            .map((slot, idx) => {
              const slotIndex = players.length + idx;
              const isCurrent = isSlotInProgress(slot, slotIndex);
              const isComplete = isSlotComplete(slot);
              const isPending = slotIndex > currentTurnIndex;
              const playerColor = getPlayerColor(slot.player.color as PlayerColor);

              return (
                <div
                  key={`${slot.playerId}-2`}
                  className={`${styles.turnSlot} ${
                    isCurrent ? styles.current : ''
                  } ${isComplete ? styles.complete : ''} ${
                    isPending ? styles.pending : ''
                  }`}
                  style={{
                    borderColor: playerColor,
                    backgroundColor: isCurrent ? `${playerColor}20` : undefined,
                  }}
                >
                  {/* Player color indicator */}
                  <div
                    className={styles.playerDot}
                    style={{ backgroundColor: playerColor }}
                  />

                  {/* Player name */}
                  <span className={styles.slotPlayerName}>
                    {slot.player.name.substring(0, 8)}
                    {slot.player.name.length > 8 ? '...' : ''}
                  </span>

                  {/* Completion indicators */}
                  <div className={styles.completionIndicators}>
                    <div
                      className={`${styles.indicator} ${
                        slot.isSettlementDone ? styles.done : ''
                      }`}
                      title="Settlement"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L4 9v12h16V9l-8-6z" />
                      </svg>
                    </div>
                    <div
                      className={`${styles.indicator} ${
                        slot.isRoadDone ? styles.done : ''
                      }`}
                      title="Road"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="10" width="20" height="4" rx="1" />
                      </svg>
                    </div>
                  </div>

                  {/* Current turn indicator */}
                  {isCurrent && (
                    <div
                      className={styles.currentIndicator}
                      style={{ backgroundColor: playerColor }}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.indicator} ${styles.done}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L4 9v12h16V9l-8-6z" />
            </svg>
          </div>
          <span>Settlement placed</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.indicator} ${styles.done}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="10" width="20" height="4" rx="1" />
            </svg>
          </div>
          <span>Road placed</span>
        </div>
      </div>
    </div>
  );
};

export default SetupTurnOrder;
