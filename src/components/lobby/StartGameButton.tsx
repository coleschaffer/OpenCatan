import { useMemo } from 'react';
import styles from './lobby.module.css';

interface StartGameButtonProps {
  isHost: boolean;
  playerCount: number;
  minPlayers: number;
  allPlayersReady: boolean;
  isReady: boolean;
  hasColorSelected: boolean;
  onStartGame: () => void;
  onToggleReady: () => void;
}

/**
 * StartGameButton - Multi-purpose button for ready state and game start
 *
 * Features:
 * - For all players: Toggle ready/not ready state
 * - For host: Shows "Start Game" when all players ready
 * - For non-host: Shows ready state
 * - Disabled states with explanations
 * - Prominent styling with hover effects
 */
export function StartGameButton({
  isHost,
  playerCount,
  minPlayers,
  allPlayersReady,
  isReady,
  hasColorSelected,
  onStartGame,
  onToggleReady,
}: StartGameButtonProps) {
  const canStart = isHost && playerCount >= minPlayers && allPlayersReady;
  const canToggleReady = hasColorSelected;

  // Determine button behavior and content
  const isStartMode = isHost && allPlayersReady && playerCount >= minPlayers;

  const buttonText = useMemo(() => {
    if (isStartMode) {
      return 'Start Game';
    }
    if (isReady) {
      return 'Ready!';
    }
    return 'Ready Up';
  }, [isStartMode, isReady]);

  const buttonIcon = useMemo(() => {
    if (isStartMode) {
      return <PlayIcon />;
    }
    if (isReady) {
      return <CheckIcon />;
    }
    return <ReadyIcon />;
  }, [isStartMode, isReady]);

  const disabledReason = useMemo(() => {
    if (!hasColorSelected) {
      return 'Select a color first';
    }
    if (isHost && !isStartMode && playerCount < minPlayers) {
      return `Need at least ${minPlayers} players`;
    }
    return null;
  }, [hasColorSelected, isHost, isStartMode, playerCount, minPlayers]);

  const handleClick = () => {
    if (isStartMode) {
      onStartGame();
    } else {
      onToggleReady();
    }
  };

  const isDisabled = isStartMode ? !canStart : !canToggleReady;

  return (
    <div className={styles.startGameButtonContainer}>
      <button
        type="button"
        className={`${styles.startGameButton} ${
          !isStartMode && isReady ? styles.startGameButtonReady : ''
        }`}
        onClick={handleClick}
        disabled={isDisabled}
        aria-pressed={!isStartMode ? isReady : undefined}
      >
        {buttonIcon}
        {buttonText}
      </button>
      {disabledReason && (
        <div className={styles.startGameDisabledReason}>
          {disabledReason}
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ReadyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 12 16 16 12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  );
}

export default StartGameButton;
