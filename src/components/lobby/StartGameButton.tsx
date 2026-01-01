import { useMemo } from 'react';
import styles from './lobby.module.css';

interface StartGameButtonProps {
  isHost: boolean;
  playerCount: number;
  minPlayers: number;
  allPlayersReady: boolean;
  onStartGame: () => void;
}

/**
 * StartGameButton - Host-only button to start the game
 *
 * Features:
 * - Only visible/enabled for the host
 * - Enabled only when: all players ready, minimum 3 players
 * - Shows why disabled if applicable
 * - Prominent styling with hover effects
 */
export function StartGameButton({
  isHost,
  playerCount,
  minPlayers,
  allPlayersReady,
  onStartGame,
}: StartGameButtonProps) {
  const canStart = isHost && playerCount >= minPlayers && allPlayersReady;

  const disabledReason = useMemo(() => {
    if (!isHost) {
      return null; // Non-hosts don't see this button
    }
    if (playerCount < minPlayers) {
      return `Need at least ${minPlayers} players to start`;
    }
    return null;
  }, [isHost, playerCount, minPlayers]);

  if (!isHost) {
    return (
      <div className={styles.gameLobbyWaitingMessage}>
        Waiting for host to start...
      </div>
    );
  }

  return (
    <div className={styles.startGameButtonContainer}>
      <button
        type="button"
        className={styles.startGameButton}
        onClick={onStartGame}
        disabled={!canStart}
        title={disabledReason || 'Start the game'}
      >
        <PlayIcon />
        Start Game
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

export default StartGameButton;
