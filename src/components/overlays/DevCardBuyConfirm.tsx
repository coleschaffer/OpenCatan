/**
 * DevCardBuyConfirm Component
 *
 * Confirmation modal when buying a development card.
 * Shows the cost (1 ore, 1 grain, 1 wool) and remaining deck count.
 */

import React, { useCallback } from 'react';
import { Modal } from './Modal';
import styles from './DevCardBuyConfirm.module.css';

export interface DevCardBuyConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when purchase is confirmed */
  onConfirm: () => void;
  /** Number of development cards remaining in deck */
  deckCount: number;
  /** Whether player can afford the card */
  canAfford: boolean;
  /** Current resources (for display) */
  currentResources?: {
    ore: number;
    grain: number;
    wool: number;
  };
}

const DEV_CARD_COST = {
  ore: 1,
  grain: 1,
  wool: 1,
};

const RESOURCE_ICONS: Record<string, string> = {
  ore: '/assets/cards/card_resource_ore.svg',
  grain: '/assets/cards/card_resource_grain.svg',
  wool: '/assets/cards/card_resource_wool.svg',
};

const RESOURCE_LABELS: Record<string, string> = {
  ore: 'Ore',
  grain: 'Grain',
  wool: 'Wool',
};

/**
 * DevCardBuyConfirm component for confirming dev card purchase
 */
export const DevCardBuyConfirm: React.FC<DevCardBuyConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deckCount,
  canAfford,
  currentResources,
}) => {
  const handleConfirm = useCallback(() => {
    if (canAfford && deckCount > 0) {
      onConfirm();
    }
  }, [canAfford, deckCount, onConfirm]);

  const isDeckEmpty = deckCount === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buy Development Card?"
      size="small"
    >
      <div className={styles.container}>
        {/* Card Icon */}
        <div className={styles.cardIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.5"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>

        {/* Cost Display */}
        <div className={styles.costSection}>
          <span className={styles.costLabel}>Cost:</span>
          <div className={styles.costItems}>
            {Object.entries(DEV_CARD_COST).map(([resource, amount]) => {
              const hasEnough = currentResources
                ? currentResources[resource as keyof typeof currentResources] >= amount
                : true;

              return (
                <div
                  key={resource}
                  className={`${styles.costItem} ${!hasEnough ? styles.costItemMissing : ''}`}
                >
                  <img
                    src={RESOURCE_ICONS[resource]}
                    alt={RESOURCE_LABELS[resource]}
                    className={styles.resourceIcon}
                  />
                  <span className={styles.resourceAmount}>{amount}</span>
                  <span className={styles.resourceName}>{RESOURCE_LABELS[resource]}</span>
                  {currentResources && (
                    <span className={styles.currentAmount}>
                      (have {currentResources[resource as keyof typeof currentResources]})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deck Count */}
        <div className={`${styles.deckInfo} ${isDeckEmpty ? styles.deckInfoEmpty : ''}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="7" y="1" width="10" height="3" rx="1" />
          </svg>
          <span>
            {isDeckEmpty
              ? 'No cards remaining in deck'
              : `${deckCount} card${deckCount !== 1 ? 's' : ''} remaining in deck`}
          </span>
        </div>

        {/* Warning Messages */}
        {!canAfford && !isDeckEmpty && (
          <div className={styles.warning}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Not enough resources to buy a development card.</span>
          </div>
        )}

        {/* Info */}
        <p className={styles.infoText}>
          Development cards provide powerful one-time effects or ongoing benefits.
          You cannot play a card on the same turn you buy it.
        </p>

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
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!canAfford || isDeckEmpty}
          >
            {isDeckEmpty
              ? 'Deck Empty'
              : canAfford
                ? 'Buy Card'
                : 'Cannot Afford'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DevCardBuyConfirm;
