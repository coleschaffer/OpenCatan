/**
 * KnightCardOverlay Component
 *
 * Overlay for the Knight card flow, which is similar to robber but
 * initiated by playing a development card. Handles the move robber
 * and steal sequence, updating largest army tracking afterward.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import { RobberMoveSelector, type HexPlayerInfo } from './RobberMoveSelector';
import { StealSelector, type StealVictim } from './StealSelector';
import type { HexCoord } from '../../types/coordinates';
import styles from './KnightCardOverlay.module.css';

export type KnightPhase = 'move' | 'steal' | 'complete';

export interface KnightCardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current phase of knight card */
  phase: KnightPhase;
  /** Valid hexes for robber placement */
  validHexes: HexCoord[];
  /** Current robber location */
  currentRobberLocation?: HexCoord;
  /** Called when robber is moved */
  onMoveRobber: (hex: HexCoord) => void;
  /** Potential victims to steal from */
  stealVictims: StealVictim[];
  /** Called when victim is selected */
  onSteal: (playerId: string) => void;
  /** Called when skipping steal */
  onSkipSteal: () => void;
  /** Time remaining */
  timeRemaining?: number;
  /** Whether friendly robber is enabled */
  friendlyRobberEnabled?: boolean;
  /** Additional hex info for display */
  hexInfo?: HexPlayerInfo[];
  /** Current knight count for player */
  knightCount?: number;
  /** Knights needed for largest army */
  knightsForLargestArmy?: number;
}

/**
 * KnightCardOverlay handles the knight card sequence
 */
export const KnightCardOverlay: React.FC<KnightCardOverlayProps> = ({
  isOpen,
  onClose,
  phase,
  validHexes,
  currentRobberLocation,
  onMoveRobber,
  stealVictims,
  onSteal,
  onSkipSteal,
  timeRemaining,
  friendlyRobberEnabled = false,
  hexInfo = [],
  knightCount = 0,
  knightsForLargestArmy = 3,
}) => {
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);

  // Reset selected hex when phase changes
  React.useEffect(() => {
    if (phase === 'move') {
      setSelectedHex(null);
    }
  }, [phase]);

  const handleMoveConfirm = useCallback(() => {
    if (selectedHex) {
      onMoveRobber(selectedHex);
    }
  }, [selectedHex, onMoveRobber]);

  // Progress indicator
  const progressSteps = useMemo(() => [
    { id: 'move', label: 'Move Robber', complete: phase === 'steal' || phase === 'complete' },
    { id: 'steal', label: 'Steal', complete: phase === 'complete' },
  ], [phase]);

  // Render move phase
  const renderMovePhase = () => (
    <div className={styles.phaseContainer}>
      {/* Knight Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.knightIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
            <path d="M12 2L8 6v4l-4 4v4l4 4h8l4-4v-4l-4-4V6l-4-4z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.cardTitle}>Knight Card</h3>
          <p className={styles.cardSubtitle}>Move the robber and steal a resource</p>
        </div>
      </div>

      {/* Knight Counter */}
      <div className={styles.knightCounter}>
        <span className={styles.counterLabel}>Knights Played:</span>
        <span className={styles.counterValue}>{knightCount + 1}</span>
        {knightCount + 1 >= knightsForLargestArmy && (
          <span className={styles.armyBadge}>
            Largest Army!
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div className={styles.progressSteps}>
        {progressSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`${styles.step} ${
              step.id === phase ? styles.stepActive : ''
            } ${step.complete ? styles.stepComplete : ''}`}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {index < progressSteps.length - 1 && (
              <div className={`${styles.stepConnector} ${
                step.complete ? styles.stepConnectorComplete : ''
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Robber Move Selector */}
      <RobberMoveSelector
        isOpen={true}
        onClose={() => {}}
        validHexes={validHexes}
        currentLocation={currentRobberLocation}
        onSelect={onMoveRobber}
        timeRemaining={timeRemaining}
        friendlyRobberEnabled={friendlyRobberEnabled}
        hexInfo={hexInfo}
      />
    </div>
  );

  // Render steal phase
  const renderStealPhase = () => (
    <div className={styles.phaseContainer}>
      {/* Knight Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.knightIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
            <path d="M12 2L8 6v4l-4 4v4l4 4h8l4-4v-4l-4-4V6l-4-4z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.cardTitle}>Knight Card</h3>
          <p className={styles.cardSubtitle}>Choose a player to steal from</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className={styles.progressSteps}>
        {progressSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`${styles.step} ${
              step.id === phase ? styles.stepActive : ''
            } ${step.complete ? styles.stepComplete : ''}`}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {index < progressSteps.length - 1 && (
              <div className={`${styles.stepConnector} ${
                step.complete ? styles.stepConnectorComplete : ''
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Steal Selector */}
      <StealSelector
        isOpen={true}
        onClose={onSkipSteal}
        victims={stealVictims}
        onSelect={onSteal}
        timeRemaining={timeRemaining}
      />
    </div>
  );

  // Render complete phase
  const renderCompletePhase = () => (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Knight Card Complete"
      size="small"
    >
      <div className={styles.completeContainer}>
        <div className={styles.completeIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className={styles.completeText}>Knight card played successfully!</p>
        <p className={styles.knightTotal}>
          Total knights: <strong>{knightCount + 1}</strong>
        </p>
        <button
          type="button"
          className={styles.continueButton}
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </Modal>
  );

  if (!isOpen) {
    return null;
  }

  // Render based on phase
  switch (phase) {
    case 'move':
      return renderMovePhase();
    case 'steal':
      return renderStealPhase();
    case 'complete':
      return renderCompletePhase();
    default:
      return null;
  }
};

export default KnightCardOverlay;
