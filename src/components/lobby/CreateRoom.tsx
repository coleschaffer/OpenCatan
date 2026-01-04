import { useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import styles from './lobby.module.css';
import { getPlayerName } from '../../network/session';

interface CreateRoomProps {
  onCreateRoom: (playerName: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * CreateRoom - Form for creating a new game room
 *
 * Features:
 * - Input for player name
 * - Create button with loading state
 * - Error display for connection issues
 */
export function CreateRoom({
  onCreateRoom,
  isLoading = false,
  error,
}: CreateRoomProps) {
  const [playerName, setPlayerName] = useState(() => getPlayerName() || '');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmedName = playerName.trim();
      if (trimmedName && !isLoading) {
        onCreateRoom(trimmedName);
      }
    },
    [playerName, isLoading, onCreateRoom]
  );

  const isValid = playerName.trim().length > 0;

  return (
    <div className={styles.createRoomContainer}>
      <div className={styles.createRoomCard}>
        <h2 className={styles.createRoomTitle}>Create a New Game</h2>
        <p className={styles.createRoomSubtitle}>
          You will be the host and can configure game settings
        </p>

        <form className={styles.createRoomForm} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.createRoomInput}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            disabled={isLoading}
            aria-label="Player name"
          />

          <button
            type="submit"
            className={styles.createRoomButton}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Creating Room...
              </>
            ) : (
              'Create Room'
            )}
          </button>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}

export default CreateRoom;
