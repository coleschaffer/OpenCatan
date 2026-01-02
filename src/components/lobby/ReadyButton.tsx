import styles from './lobby.module.css';

interface ReadyButtonProps {
  isReady: boolean;
  hasColorSelected: boolean;
  onToggleReady: () => void;
}

/**
 * ReadyButton - Toggle ready/not ready state
 *
 * Features:
 * - Toggle between ready and not ready states
 * - Disabled until a color is selected
 * - Visual state change between ready and not ready
 * - Shows reason when disabled
 */
export function ReadyButton({
  isReady,
  hasColorSelected,
  onToggleReady,
}: ReadyButtonProps) {
  const canToggle = hasColorSelected;

  return (
    <div>
      <button
        type="button"
        className={`${styles.readyButton} ${
          isReady ? styles.readyButtonReady : styles.readyButtonNotReady
        }`}
        onClick={onToggleReady}
        disabled={!canToggle}
        aria-pressed={isReady}
      >
        {isReady ? '✓ Ready!' : 'Click when Ready'}
      </button>
      {!hasColorSelected && (
        <div className={styles.readyButtonDisabledReason}>
          Select a color first
        </div>
      )}
    </div>
  );
}

export default ReadyButton;
