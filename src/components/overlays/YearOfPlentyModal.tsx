import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from './Modal';
import type { ResourceType, ResourceCounts } from '../../types';
import styles from './YearOfPlentyModal.module.css';

export interface YearOfPlentyModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Available resources in the bank */
  bankResources: ResourceCounts;
  /** Called when 2 resources are selected and confirmed */
  onSubmit: (resources: [ResourceType, ResourceType]) => void;
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

/**
 * YearOfPlentyModal component for selecting 2 resources from the bank
 * when playing the Year of Plenty development card.
 */
export const YearOfPlentyModal: React.FC<YearOfPlentyModalProps> = ({
  isOpen,
  onClose,
  bankResources,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<ResourceType[]>([]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected([]);
    }
  }, [isOpen]);

  const handleResourceClick = useCallback(
    (resource: ResourceType) => {
      setSelected((prev) => {
        // If already at 2 selections, replace the first one
        if (prev.length >= 2) {
          return [prev[1], resource];
        }

        // Check if we can add this resource
        const currentCount = prev.filter((r) => r === resource).length;
        const bankCount = bankResources[resource];

        // Can't select more than available in bank
        if (currentCount >= bankCount) {
          return prev;
        }

        return [...prev, resource];
      });
    },
    [bankResources]
  );

  const handleRemove = useCallback((index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selected.length === 2) {
      onSubmit([selected[0], selected[1]]);
    }
  }, [selected, onSubmit]);

  const canSelectResource = useCallback(
    (resource: ResourceType) => {
      const bankCount = bankResources[resource];
      if (bankCount === 0) return false;

      // If we have 2 selected, we can always replace
      if (selected.length >= 2) return true;

      // Check if we can add another of this type
      const currentCount = selected.filter((r) => r === resource).length;
      return currentCount < bankCount;
    },
    [bankResources, selected]
  );

  const isComplete = selected.length === 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Year of Plenty"
      size="medium"
      closeOnBackdropClick={false}
    >
      <div className={styles.container}>
        {/* Card Icon */}
        <div className={styles.cardIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4caf50"
            strokeWidth="1.5"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>Choose 2 resources from the bank.</p>
          <p className={styles.subText}>You may choose the same resource twice.</p>
        </div>

        {/* Selection Display */}
        <div className={styles.selection}>
          <div className={styles.selectionLabel}>Selected:</div>
          <div className={styles.selectedResources}>
            {[0, 1].map((index) => (
              <div
                key={index}
                className={`${styles.selectedSlot} ${selected[index] ? styles.selectedSlotFilled : ''}`}
                onClick={() => selected[index] && handleRemove(index)}
              >
                {selected[index] ? (
                  <>
                    <img
                      src={RESOURCE_ICONS[selected[index]]}
                      alt={RESOURCE_LABELS[selected[index]]}
                      className={styles.selectedIcon}
                    />
                    <span className={styles.removeHint}>Click to remove</span>
                  </>
                ) : (
                  <span className={styles.emptySlot}>?</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resource Options */}
        <div className={styles.resourceGrid}>
          {RESOURCES.map((resource) => {
            const bankCount = bankResources[resource];
            const isDepleted = bankCount === 0;
            const canSelect = canSelectResource(resource);

            return (
              <button
                key={resource}
                type="button"
                className={`${styles.resourceButton} ${isDepleted ? styles.resourceButtonDepleted : ''}`}
                onClick={() => handleResourceClick(resource)}
                disabled={!canSelect}
              >
                <img
                  src={RESOURCE_ICONS[resource]}
                  alt={RESOURCE_LABELS[resource]}
                  className={styles.resourceIcon}
                />
                <span className={styles.resourceName}>{RESOURCE_LABELS[resource]}</span>
                <span className={`${styles.bankCount} ${isDepleted ? styles.bankCountDepleted : ''}`}>
                  {bankCount} in bank
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            {isComplete ? 'Confirm' : `Select ${2 - selected.length} more`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default YearOfPlentyModal;
