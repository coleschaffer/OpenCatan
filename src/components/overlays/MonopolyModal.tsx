import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from './Modal';
import type { ResourceType } from '../../types';
import styles from './MonopolyModal.module.css';

export interface ResourcePreview {
  /** Resource type */
  resource: ResourceType;
  /** Number of cards that will be collected */
  count: number;
  /** Number of players who have this resource */
  playersWithResource: number;
}

export interface MonopolyModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when a resource type is selected */
  onSubmit: (resource: ResourceType) => void;
  /** Preview of what will be collected (optional) */
  resourcePreviews?: ResourcePreview[];
  /** Result after monopoly is executed (optional) */
  result?: {
    resource: ResourceType;
    collected: number;
  } | null;
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

const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#b45309',
  lumber: '#166534',
  ore: '#374151',
  grain: '#ca8a04',
  wool: '#65a30d',
};

/**
 * MonopolyModal component for selecting which resource type to claim
 * when playing the Monopoly development card.
 */
export const MonopolyModal: React.FC<MonopolyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  resourcePreviews = [],
  result = null,
}) => {
  const [selected, setSelected] = useState<ResourceType | null>(null);

  // Get preview for selected resource
  const selectedPreview = resourcePreviews.find(
    (p) => p.resource === selected
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(null);
    }
  }, [isOpen]);

  const handleSelect = useCallback((resource: ResourceType) => {
    setSelected(resource);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selected) {
      onSubmit(selected);
    }
  }, [selected, onSubmit]);

  // If showing result
  if (result) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Monopoly Complete!"
        size="small"
      >
        <div className={styles.resultContainer}>
          <div className={styles.resultIcon}>
            <img
              src={RESOURCE_ICONS[result.resource]}
              alt={RESOURCE_LABELS[result.resource]}
              className={styles.resultResourceIcon}
            />
          </div>
          <p className={styles.resultText}>
            You collected{' '}
            <strong style={{ color: RESOURCE_COLORS[result.resource] }}>
              {result.collected} {RESOURCE_LABELS[result.resource]}
            </strong>{' '}
            from other players!
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
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monopoly"
      size="small"
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
            stroke="#fbbf24"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M6 12h12" />
            <path d="M9 9h6M9 15h6" />
          </svg>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>
            Choose a resource type to monopolize.
          </p>
          <p className={styles.subText}>
            All other players must give you all of their cards of this type.
          </p>
        </div>

        {/* Resource Buttons */}
        <div className={styles.resourceGrid}>
          {RESOURCES.map((resource) => {
            const isSelected = selected === resource;
            const colorHex = RESOURCE_COLORS[resource];
            const preview = resourcePreviews.find((p) => p.resource === resource);

            return (
              <button
                key={resource}
                type="button"
                className={`${styles.resourceButton} ${isSelected ? styles.resourceButtonSelected : ''}`}
                onClick={() => handleSelect(resource)}
                style={
                  {
                    '--resource-color': colorHex,
                    borderColor: isSelected ? colorHex : undefined,
                  } as React.CSSProperties
                }
              >
                <img
                  src={RESOURCE_ICONS[resource]}
                  alt={RESOURCE_LABELS[resource]}
                  className={styles.resourceIcon}
                />
                <span className={styles.resourceName}>{RESOURCE_LABELS[resource]}</span>
                {preview && preview.count > 0 && (
                  <span className={styles.previewCount}>
                    +{preview.count} from {preview.playersWithResource} player{preview.playersWithResource !== 1 ? 's' : ''}
                  </span>
                )}
                {isSelected && (
                  <div className={styles.selectedCheck}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Preview Info */}
        {selectedPreview && (
          <div className={styles.previewInfo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              You will collect <strong>{selectedPreview.count}</strong> {RESOURCE_LABELS[selected!]}
              from <strong>{selectedPreview.playersWithResource}</strong> player{selectedPreview.playersWithResource !== 1 ? 's' : ''}
            </span>
          </div>
        )}

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
            disabled={!selected}
          >
            {selected ? `Claim all ${RESOURCE_LABELS[selected]}` : 'Select a resource'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MonopolyModal;
