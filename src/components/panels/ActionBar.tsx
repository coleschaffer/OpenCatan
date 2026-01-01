import React from 'react';
import styles from './ActionBar.module.css';

/**
 * Game action types that can be triggered from the action bar
 */
export type ActionType =
  | 'build'
  | 'trade'
  | 'buyDevCard'
  | 'endTurn'
  | 'rollDice'
  | 'cancelAction';

/**
 * Game phase type (subset relevant to action bar)
 */
export type GamePhase =
  | 'roll'
  | 'main'
  | 'discard'
  | 'robber-move'
  | 'robber-steal'
  | 'road-building'
  | 'year-of-plenty'
  | 'monopoly'
  | 'setup-settlement-1'
  | 'setup-road-1'
  | 'setup-settlement-2'
  | 'setup-road-2'
  | 'ended';

interface ActionBarProps {
  /** Current game phase */
  phase: GamePhase;
  /** Whether the player can build anything */
  canBuild: boolean;
  /** Whether the player can initiate a trade */
  canTrade: boolean;
  /** Whether the player can buy a development card */
  canBuyDevCard: boolean;
  /** Whether the player can end their turn */
  canEndTurn: boolean;
  /** Whether it's the player's turn */
  isMyTurn: boolean;
  /** Remaining time for the turn in seconds */
  turnTimeRemaining?: number;
  /** Callback when an action is triggered */
  onAction: (action: ActionType) => void;
}

/**
 * ActionBar - Bottom action buttons with integrated building icons
 *
 * Displays context-sensitive action buttons based on the current
 * game phase. The Build button has been replaced with inline
 * building icons (road, settlement, city, dev card) that show
 * real-time availability status.
 *
 * @param phase - Current game phase
 * @param canBuild - Whether building is available
 * @param canTrade - Whether trading is available
 * @param canBuyDevCard - Whether buying dev cards is available
 * @param canEndTurn - Whether ending turn is available
 * @param isMyTurn - Whether it's the player's turn
 * @param turnTimeRemaining - Time left in seconds
 * @param onAction - Action callback
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  phase,
  canBuild,
  canTrade,
  canBuyDevCard,
  canEndTurn,
  isMyTurn,
  turnTimeRemaining,
  onAction,
}) => {
  /**
   * Get the phase label for display
   */
  const getPhaseLabel = (): string => {
    switch (phase) {
      case 'roll':
        return 'Roll Dice';
      case 'main':
        return 'Your Turn';
      case 'discard':
        return 'Discard Cards';
      case 'robber-move':
        return 'Move Robber';
      case 'robber-steal':
        return 'Steal a Card';
      case 'road-building':
        return 'Place Roads';
      case 'year-of-plenty':
        return 'Choose Resources';
      case 'monopoly':
        return 'Choose Resource';
      case 'setup-settlement-1':
      case 'setup-settlement-2':
        return 'Place Settlement';
      case 'setup-road-1':
      case 'setup-road-2':
        return 'Place Road';
      case 'ended':
        return 'Game Over';
      default:
        return 'Waiting...';
    }
  };

  /**
   * Format time remaining
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Determine if timer should show warning state
   */
  const isTimerLow = turnTimeRemaining !== undefined && turnTimeRemaining <= 10;
  const isTimerCritical = turnTimeRemaining !== undefined && turnTimeRemaining <= 5;

  /**
   * Check if we should show the roll dice button
   */
  const showRollDice = phase === 'roll' && isMyTurn;

  /**
   * Check if we should show main action buttons
   * Only show during main phase when it's the player's turn
   * The BuildingToolbar should NOT be visible during roll phase or any other non-main phase
   */
  const showMainActions = phase === 'main' && isMyTurn;

  /**
   * Check if we're in a special phase that requires cancellation
   */
  const showCancelAction =
    isMyTurn &&
    (phase === 'road-building' ||
      phase === 'year-of-plenty' ||
      phase === 'monopoly');

  return (
    <div className={styles.actionBar}>
      {/* Phase indicator */}
      <div className={styles.phaseSection}>
        <span className={`${styles.phaseLabel} ${isMyTurn ? styles.myTurn : ''}`}>
          {isMyTurn ? getPhaseLabel() : "Opponent's Turn"}
        </span>

        {/* Timer display */}
        {turnTimeRemaining !== undefined && turnTimeRemaining > 0 && isMyTurn && (
          <span
            className={`${styles.timer} ${isTimerLow ? styles.timerLow : ''} ${isTimerCritical ? styles.timerCritical : ''}`}
          >
            {formatTime(turnTimeRemaining)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {/* Roll Dice button */}
        {showRollDice && (
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => onAction('rollDice')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2.5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.5 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.5 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
            </svg>
            <span>Roll Dice</span>
          </button>
        )}

        {/* Main phase actions */}
        {showMainActions && (
          <>
            {/* Trade button */}
            <button
              className={`${styles.actionButton} ${canTrade ? '' : styles.disabled}`}
              onClick={() => canTrade && onAction('trade')}
              disabled={!canTrade}
              title={canTrade ? 'Open trade menu' : 'Cannot trade right now'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
              </svg>
              <span>Trade</span>
            </button>

            {/* End Turn button */}
            <button
              className={`${styles.actionButton} ${styles.endTurn} ${canEndTurn ? '' : styles.disabled}`}
              onClick={() => canEndTurn && onAction('endTurn')}
              disabled={!canEndTurn}
              title={canEndTurn ? 'End your turn' : 'Complete required actions first'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>End Turn</span>
            </button>
          </>
        )}

        {/* Cancel action button for special phases */}
        {showCancelAction && (
          <button
            className={`${styles.actionButton} ${styles.cancel}`}
            onClick={() => onAction('cancelAction')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            <span>Cancel</span>
          </button>
        )}

        {/* Waiting state for non-turn */}
        {!isMyTurn && phase !== 'ended' && (
          <div className={styles.waitingIndicator}>
            <div className={styles.spinner} />
            <span>Waiting for opponent...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionBar;
