/**
 * SetupInstructions - Instructions panel for setup phase
 *
 * Displays:
 * - "Place your first settlement"
 * - "Place a road from your settlement"
 * - "Place your second settlement"
 * - "Place a road from your second settlement"
 *
 * Highlights the current action and shows whose turn it is.
 */

import React from 'react';
import styles from './setup.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SetupInstructionsProps {
  /** Current placement type */
  placementType: 'settlement' | 'road';
  /** Which setup round (1 or 2) */
  setupRound: 1 | 2;
  /** Whether it's the local player's turn */
  isMyTurn: boolean;
  /** Whether this is a second settlement (grants resources) */
  isSecondSettlement: boolean;
  /** Name of the current player */
  currentPlayerName: string;
  /** Color of the current player (hex) */
  playerColor: string;
}

// ============================================================================
// Instruction Steps
// ============================================================================

interface InstructionStep {
  id: string;
  round: 1 | 2;
  type: 'settlement' | 'road';
  label: string;
  description: string;
  icon: string;
}

const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    id: 'settlement-1',
    round: 1,
    type: 'settlement',
    label: 'First Settlement',
    description: 'Place your first settlement on any valid intersection',
    icon: 'home',
  },
  {
    id: 'road-1',
    round: 1,
    type: 'road',
    label: 'First Road',
    description: 'Place a road adjacent to your settlement',
    icon: 'road',
  },
  {
    id: 'settlement-2',
    round: 2,
    type: 'settlement',
    label: 'Second Settlement',
    description: 'Place your second settlement (you will receive starting resources!)',
    icon: 'home-plus',
  },
  {
    id: 'road-2',
    round: 2,
    type: 'road',
    label: 'Second Road',
    description: 'Place a road adjacent to your second settlement',
    icon: 'road',
  },
];

// ============================================================================
// Component
// ============================================================================

export const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  placementType,
  setupRound,
  isMyTurn,
  isSecondSettlement,
  currentPlayerName,
  playerColor,
}) => {
  // Determine current step
  const getCurrentStep = (): InstructionStep | undefined => {
    return INSTRUCTION_STEPS.find(
      (step) => step.round === setupRound && step.type === placementType
    );
  };

  const currentStep = getCurrentStep();

  // Get icon SVG based on type
  const renderIcon = (iconType: string, isActive: boolean) => {
    const color = isActive ? playerColor : 'currentColor';

    switch (iconType) {
      case 'home':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'home-plus':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <line x1="12" y1="14" x2="12" y2="18" />
            <line x1="10" y1="16" x2="14" y2="16" />
          </svg>
        );
      case 'road':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19L20 5" />
            <path d="M4 5L20 19" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Determine step status (completed, current, pending)
  const getStepStatus = (
    step: InstructionStep
  ): 'completed' | 'current' | 'pending' => {
    const currentIndex = INSTRUCTION_STEPS.findIndex(
      (s) => s.round === setupRound && s.type === placementType
    );
    const stepIndex = INSTRUCTION_STEPS.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={styles.instructionsPanel}>
      {/* Header */}
      <div className={styles.instructionsHeader}>
        <h3 className={styles.instructionsTitle}>Setup Instructions</h3>
        {!isMyTurn && (
          <span
            className={styles.waitingIndicator}
            style={{ color: playerColor }}
          >
            Waiting for {currentPlayerName}...
          </span>
        )}
      </div>

      {/* Step List */}
      <div className={styles.stepList}>
        {INSTRUCTION_STEPS.map((step) => {
          const status = getStepStatus(step);
          const isActive = status === 'current';

          return (
            <div
              key={step.id}
              className={`${styles.stepItem} ${styles[status]}`}
              style={
                isActive ? { borderLeftColor: playerColor } : undefined
              }
            >
              {/* Step Icon */}
              <div
                className={styles.stepIcon}
                style={isActive ? { backgroundColor: `${playerColor}20` } : undefined}
              >
                {status === 'completed' ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.checkmark}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  renderIcon(step.icon, isActive)
                )}
              </div>

              {/* Step Content */}
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{step.label}</span>
                {isActive && (
                  <span className={styles.stepDescription}>
                    {step.description}
                  </span>
                )}
              </div>

              {/* Active indicator */}
              {isActive && isMyTurn && (
                <div
                  className={styles.activeIndicator}
                  style={{ backgroundColor: playerColor }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Action Callout */}
      {currentStep && isMyTurn && (
        <div
          className={styles.currentAction}
          style={{ borderColor: playerColor, backgroundColor: `${playerColor}10` }}
        >
          <div className={styles.currentActionIcon}>
            {renderIcon(currentStep.icon, true)}
          </div>
          <div className={styles.currentActionText}>
            <strong>{currentStep.label}</strong>
            <p>{currentStep.description}</p>
            {isSecondSettlement && placementType === 'settlement' && (
              <span className={styles.resourceHint}>
                Adjacent hexes will provide starting resources!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupInstructions;
