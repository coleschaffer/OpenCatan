import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from './Modal';
import type { ResourceType, ResourceCounts } from '../../types';
import styles from './DiscardModal.module.css';

export interface DiscardModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current hand of resources */
  hand: ResourceCounts;
  /** Number of cards that must be discarded */
  discardCount: number;
  /** Called when discard selection is submitted */
  onSubmit: (discarded: ResourceCounts) => void;
  /** Time remaining in seconds before auto-discard */
  timeRemaining?: number;
  /** Called when time expires (for auto-discard) */
  onTimeout?: () => void;
}

const RESOURCES: ResourceType[] = ['brick', 'lumber', 'ore', 'grain', 'wool'];

const RESOURCE_ICONS: Record<ResourceType, string> = {
  brick: '/assets/cards/card_resource_brick.svg',
  lumber: '/assets/cards/card_resource_lumber.svg',
  ore: '/assets/cards/card_resource_ore.svg',
  grain: '/assets/cards/card_resource_grain.svg',
  wool: '/assets/cards/card_resource_wool.svg',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  brick: 'Brick',
  lumber: 'Lumber',
  ore: 'Ore',
  grain: 'Grain',
  wool: 'Wool',
};

const createEmptyResources = (): ResourceCounts => ({
  brick: 0,
  lumber: 0,
  ore: 0,
  grain: 0,
  wool: 0,
});

interface ResourceDiscardRowProps {
  resource: ResourceType;
  inHand: number;
  selected: number;
  onChange: (value: number) => void;
  disabled: boolean;
  maxSelectable: number;
}

const ResourceDiscardRow: React.FC<ResourceDiscardRowProps> = ({
  resource,
  inHand,
  selected,
  onChange,
  disabled,
  maxSelectable,
}) => {
  const handleDecrement = () => {
    if (selected > 0) {
      onChange(selected - 1);
    }
  };

  const handleIncrement = () => {
    if (selected < inHand && selected < maxSelectable) {
      onChange(selected + 1);
    }
  };

  const canIncrement = selected < inHand && selected < maxSelectable && !disabled;

  return (
    <div className={`${styles.resourceRow} ${selected > 0 ? styles.resourceRowSelected : ''}`}>
      <img
        src={RESOURCE_ICONS[resource]}
        alt={RESOURCE_LABELS[resource]}
        className={styles.resourceIcon}
      />
      <span className={styles.resourceLabel}>{RESOURCE_LABELS[resource]}</span>
      <span className={styles.inHand}>({inHand} in hand)</span>
      <div className={styles.selector}>
        <button
          type="button"
          className={styles.selectorButton}
          onClick={handleDecrement}
          disabled={selected <= 0}
          aria-label={`Decrease ${RESOURCE_LABELS[resource]}`}
        >
          -
        </button>
        <span className={`${styles.selectorValue} ${selected > 0 ? styles.selectorValueActive : ''}`}>
          {selected}
        </span>
        <button
          type="button"
          className={styles.selectorButton}
          onClick={handleIncrement}
          disabled={!canIncrement}
          aria-label={`Increase ${RESOURCE_LABELS[resource]}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

/**
 * DiscardModal component for selecting cards to discard when a 7 is rolled.
 * Shows all resources in hand with selection controls and a countdown timer.
 */
export const DiscardModal: React.FC<DiscardModalProps> = ({
  isOpen,
  onClose,
  hand,
  discardCount,
  onSubmit,
  timeRemaining,
  onTimeout,
}) => {
  const [selected, setSelected] = useState<ResourceCounts>(createEmptyResources);
  const [localTime, setLocalTime] = useState(timeRemaining);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(createEmptyResources());
      setLocalTime(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || localTime === undefined || localTime <= 0) return;

    const timer = setInterval(() => {
      setLocalTime((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, localTime, onTimeout]);

  const totalSelected = useMemo(() => {
    return Object.values(selected).reduce((sum, count) => sum + count, 0);
  }, [selected]);

  const remaining = discardCount - totalSelected;
  const isComplete = remaining === 0;

  const handleChange = useCallback((resource: ResourceType, value: number) => {
    setSelected((prev) => ({ ...prev, [resource]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (isComplete) {
      onSubmit(selected);
    }
  }, [isComplete, selected, onSubmit]);

  // Calculate max selectable for each resource
  const getMaxSelectable = useCallback(
    (resource: ResourceType) => {
      const currentOthers = Object.entries(selected)
        .filter(([r]) => r !== resource)
        .reduce((sum, [, count]) => sum + count, 0);
      return Math.min(hand[resource], discardCount - currentOthers);
    },
    [selected, hand, discardCount]
  );

  const timerDisplay = useMemo(() => {
    if (localTime === undefined) return null;
    const minutes = Math.floor(localTime / 60);
    const seconds = localTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [localTime]);

  const isTimerWarning = localTime !== undefined && localTime <= 10;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discard Cards"
      size="medium"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className={styles.container}>
        {/* Timer Warning */}
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
          <p className={styles.mainText}>
            A 7 was rolled! You must discard <strong>{discardCount}</strong> card
            {discardCount !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* Progress Counter */}
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${(totalSelected / discardCount) * 100}%` }}
          />
          <span className={styles.progressText}>
            {totalSelected} / {discardCount} selected
          </span>
        </div>

        {/* Resource Selection */}
        <div className={styles.resourceList}>
          {RESOURCES.filter((r) => hand[r] > 0).map((resource) => (
            <ResourceDiscardRow
              key={resource}
              resource={resource}
              inHand={hand[resource]}
              selected={selected[resource]}
              onChange={(value) => handleChange(resource, value)}
              disabled={isComplete && selected[resource] === 0}
              maxSelectable={getMaxSelectable(resource)}
            />
          ))}
        </div>

        {/* Empty hand message */}
        {RESOURCES.every((r) => hand[r] === 0) && (
          <div className={styles.emptyHand}>
            You have no resource cards to discard.
          </div>
        )}

        {/* Submit Button */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            {isComplete ? 'Confirm Discard' : `Select ${remaining} more`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscardModal;
