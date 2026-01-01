/**
 * LeaveGameConfirm - Confirmation dialog for leaving the game
 *
 * Displays a warning and asks for confirmation before leaving the game.
 * Shows different messaging for host vs non-host players.
 */

import React from 'react';
import { Modal } from '../ui/Modal';
import styles from './SettingsModal.module.css';

export interface LeaveGameConfirmProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user confirms leaving */
  onConfirm: () => void;
  /** Whether the current player is the host */
  isHost: boolean;
}

/**
 * Confirmation dialog for leaving a game
 *
 * @param isOpen - Whether dialog is visible
 * @param onClose - Callback to close dialog
 * @param onConfirm - Callback when user confirms leaving
 * @param isHost - Whether player is the host
 */
export const LeaveGameConfirm: React.FC<LeaveGameConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isHost,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Game?"
      size="small"
      closeOnBackdropClick={false}
    >
      <div className={styles.confirmDialog}>
        <div className={styles.confirmIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <p className={styles.confirmMessage}>
          Are you sure you want to leave?
        </p>

        <p className={styles.confirmSubtext}>
          The game will continue without you.
        </p>

        {isHost && (
          <p className={styles.confirmWarning}>
            As host, leaving will transfer host status to another player.
          </p>
        )}

        <div className={styles.confirmActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.dangerButton}
            onClick={onConfirm}
            type="button"
          >
            Leave Game
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LeaveGameConfirm;
