import React, { useCallback } from 'react';
import { Modal } from './Modal';
import type { HexCoord } from '../../types';
import styles from './RobberModal.module.css';

export interface RobberModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** List of valid hex coordinates where robber can be placed */
  validHexes: HexCoord[];
  /** Called when a hex is selected for robber placement */
  onSelect: (hex: HexCoord) => void;
  /** Whether to allow cancellation (default: false - robber must be moved) */
  canCancel?: boolean;
  /** Current robber location for reference */
  currentLocation?: HexCoord;
}

/**
 * RobberModal component provides instructions for robber placement.
 * The actual hex selection happens on the board, this modal provides
 * context and instructions to the player.
 */
export const RobberModal: React.FC<RobberModalProps> = ({
  isOpen,
  onClose,
  validHexes,
  onSelect,
  canCancel = false,
  currentLocation,
}) => {
  const handleClose = useCallback(() => {
    if (canCancel) {
      onClose();
    }
  }, [canCancel, onClose]);

  // This is primarily an instruction modal - actual selection happens on the board
  // But we can also provide a list view for accessibility

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Move the Robber"
      size="small"
      closeOnBackdropClick={canCancel}
      closeOnEscape={canCancel}
    >
      <div className={styles.container}>
        {/* Robber Icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.robberIcon}
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
            <path
              d="M28 24 Q32 28 36 24"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p className={styles.mainText}>
            Click on a highlighted hex on the board to place the robber.
          </p>
          <p className={styles.subText}>
            The robber blocks resource production for all players on that hex.
            You may then steal a card from one adjacent player.
          </p>
        </div>

        {/* Valid Hexes Count */}
        <div className={styles.hexCount}>
          <span className={styles.hexCountNumber}>{validHexes.length}</span>
          <span className={styles.hexCountLabel}>valid locations</span>
        </div>

        {/* Info about current location */}
        {currentLocation && (
          <div className={styles.currentLocation}>
            Robber is currently at position ({currentLocation.q}, {currentLocation.r})
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RobberModal;
