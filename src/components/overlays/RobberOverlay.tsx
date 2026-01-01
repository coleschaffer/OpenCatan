/**
 * RobberOverlay Component
 *
 * Main robber phase coordinator that handles the full robber sequence:
 * 1. Discard phase - Players with >7 cards must discard half
 * 2. Move phase - Active player moves robber to new hex
 * 3. Steal phase - Active player steals from adjacent player
 *
 * Shows different views for active player vs waiting players.
 */

import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { DiscardModal } from './DiscardModal';
import { DiscardWaiting } from './DiscardWaiting';
import { StealSelector, type StealVictim } from './StealSelector';
import type { ResourceCounts } from '../../types/common';
import type { HexCoord } from '../../types/coordinates';
import type { PlayerColor } from '../../types/common';
import styles from './RobberOverlay.module.css';

export type RobberPhase = 'discard' | 'move' | 'steal';

export interface PlayerDiscardStatus {
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

export interface RobberOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current robber phase */
  phase: RobberPhase;
  /** ID of the current local player */
  localPlayerId: string;
  /** ID of the player whose turn it is (who controls the robber) */
  activePlayerId: string;
  /** Name of the active player */
  activePlayerName: string;
  /** Whether local player is the active player */
  isActivePlayer: boolean;

  // Discard phase props
  /** Players who need to discard */
  playersNeedingDiscard: PlayerDiscardStatus[];
  /** Whether local player needs to discard */
  localPlayerMustDiscard: boolean;
  /** Local player's hand */
  localPlayerHand?: ResourceCounts;
  /** How many cards local player must discard */
  localDiscardCount?: number;
  /** Time remaining for discard phase */
  discardTimeRemaining?: number;
  /** Called when local player submits discard */
  onDiscard?: (resources: ResourceCounts) => void;
  /** Called when discard timer expires */
  onDiscardTimeout?: () => void;

  // Move phase props
  /** Valid hexes where robber can be placed */
  validRobberHexes?: HexCoord[];
  /** Current robber location */
  currentRobberLocation?: HexCoord;
  /** Time remaining for move phase */
  moveTimeRemaining?: number;
  /** Called when robber is moved */
  onMoveRobber?: (hex: HexCoord) => void;
  /** Whether friendly robber rule is enabled */
  friendlyRobberEnabled?: boolean;

  // Steal phase props
  /** Potential victims to steal from */
  stealVictims?: StealVictim[];
  /** Time remaining for steal phase */
  stealTimeRemaining?: number;
  /** Called when victim is selected */
  onSteal?: (playerId: string) => void;
  /** Called when skipping steal (no valid targets) */
  onSkipSteal?: () => void;
}

/**
 * RobberOverlay coordinates the full robber sequence
 */
export const RobberOverlay: React.FC<RobberOverlayProps> = ({
  isOpen,
  onClose,
  phase,
  localPlayerId,
  activePlayerId,
  activePlayerName,
  isActivePlayer,
  // Discard props
  playersNeedingDiscard = [],
  localPlayerMustDiscard = false,
  localPlayerHand,
  localDiscardCount = 0,
  discardTimeRemaining,
  onDiscard,
  onDiscardTimeout,
  // Move props
  validRobberHexes = [],
  currentRobberLocation,
  moveTimeRemaining,
  onMoveRobber,
  friendlyRobberEnabled = false,
  // Steal props
  stealVictims = [],
  stealTimeRemaining,
  onSteal,
  onSkipSteal,
}) => {
  // Get phase title
  const phaseTitle = useMemo(() => {
    switch (phase) {
      case 'discard':
        return 'Robber Activated - Discard Phase';
      case 'move':
        return 'Move the Robber';
      case 'steal':
        return 'Steal a Resource';
      default:
        return 'Robber';
    }
  }, [phase]);

  // Get phase description for waiting players
  const waitingDescription = useMemo(() => {
    switch (phase) {
      case 'discard':
        return 'Waiting for players to discard...';
      case 'move':
        return `${activePlayerName} is moving the robber...`;
      case 'steal':
        return `${activePlayerName} is choosing who to steal from...`;
      default:
        return '';
    }
  }, [phase, activePlayerName]);

  // Render discard phase content
  const renderDiscardPhase = () => {
    if (localPlayerMustDiscard && localPlayerHand && onDiscard) {
      return (
        <DiscardModal
          isOpen={true}
          onClose={() => {}}
          hand={localPlayerHand}
          discardCount={localDiscardCount}
          onSubmit={onDiscard}
          timeRemaining={discardTimeRemaining}
          onTimeout={onDiscardTimeout}
        />
      );
    }

    // Show waiting view
    return (
      <DiscardWaiting
        isOpen={true}
        onClose={() => {}}
        playersNeedingDiscard={playersNeedingDiscard}
        timeRemaining={discardTimeRemaining}
      />
    );
  };

  // Render move phase content
  const renderMovePhase = () => {
    // Active player sees highlights on board - no modal needed
    if (isActivePlayer) {
      return null;
    }

    // Show waiting view for non-active players
    return (
      <Modal
        isOpen={true}
        onClose={() => {}}
        title={phaseTitle}
        size="small"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <div className={styles.waitingContainer}>
          <div className={styles.robberIcon}>
            <svg
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
            </svg>
          </div>
          <p className={styles.waitingText}>{waitingDescription}</p>
          {moveTimeRemaining !== undefined && (
            <div className={styles.timer}>
              {Math.floor(moveTimeRemaining / 60)}:{(moveTimeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // Render steal phase content
  const renderStealPhase = () => {
    if (isActivePlayer && onSteal) {
      return (
        <StealSelector
          isOpen={true}
          onClose={onSkipSteal || (() => {})}
          victims={stealVictims}
          onSelect={onSteal}
          timeRemaining={stealTimeRemaining}
        />
      );
    }

    // Show waiting view for non-active players
    return (
      <Modal
        isOpen={true}
        onClose={() => {}}
        title={phaseTitle}
        size="small"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <div className={styles.waitingContainer}>
          <div className={styles.stealIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </div>
          <p className={styles.waitingText}>{waitingDescription}</p>
          {stealTimeRemaining !== undefined && (
            <div className={styles.timer}>
              {Math.floor(stealTimeRemaining / 60)}:{(stealTimeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </Modal>
    );
  };

  if (!isOpen) {
    return null;
  }

  // Render the appropriate phase content
  switch (phase) {
    case 'discard':
      return renderDiscardPhase();
    case 'move':
      return renderMovePhase();
    case 'steal':
      return renderStealPhase();
    default:
      return null;
  }
};

export default RobberOverlay;
