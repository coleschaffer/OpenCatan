import { useState, useCallback, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import styles from './lobby.module.css';
import { getPlayerName } from '../../network/session';

interface JoinRoomProps {
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onValidateCode?: (roomCode: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  /** Initial room code (e.g., from URL) */
  initialCode?: string | null;
}

// Valid characters for room code (letters only, no numbers as per requirement)
const VALID_CODE_CHARS = /^[A-Za-z]+$/;

/**
 * Generate a random two-word name for the player
 */
const generateRandomName = (): string => {
  const adjectives = [
    'Swift', 'Brave', 'Clever', 'Mighty', 'Noble', 'Bold', 'Wise', 'Quick',
    'Fierce', 'Gentle', 'Happy', 'Lucky', 'Eager', 'Calm', 'Keen', 'Proud',
  ];
  const nouns = [
    'Settler', 'Builder', 'Trader', 'Knight', 'Merchant', 'Explorer',
    'Pioneer', 'Farmer', 'Sailor', 'Ranger', 'Guardian', 'Champion',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
};

type JoinStep = 'enter-code' | 'validating' | 'enter-name' | 'joining';

/**
 * JoinRoom - Simplified form for joining an existing game room
 *
 * Flow:
 * 1. Just show ENTER CODE input
 * 2. When code entered, validate if room exists
 * 3. If valid, show name input
 * 4. If invalid, show error
 */
export function JoinRoom({
  onJoinRoom,
  onValidateCode,
  isLoading = false,
  error,
  initialCode,
}: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState(initialCode?.toUpperCase() || '');
  const [playerName, setPlayerName] = useState(() => {
    // Use stored player name if available, otherwise generate a random one
    return getPlayerName() || generateRandomName();
  });
  const [step, setStep] = useState<JoinStep>('enter-code');
  const [localError, setLocalError] = useState<string | null>(null);

  // Update room code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Handle external loading state
  useEffect(() => {
    if (isLoading && step === 'enter-name') {
      setStep('joining');
    }
    if (!isLoading && step === 'joining') {
      // If we're done joining but still on joining step, something failed
      // Reset to enter-name step
      setStep('enter-name');
    }
  }, [isLoading, step]);

  // Sync external error
  useEffect(() => {
    if (error) {
      setLocalError(error);
      // Reset to code entry on error
      if (step === 'validating' || step === 'joining') {
        setStep('enter-code');
      }
    }
  }, [error, step]);

  const handleCodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove non-letter characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    // Limit to 6 characters
    setRoomCode(value.slice(0, 6));
    setLocalError(null);
  }, []);

  const handleCodeSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Validate code format (1-6 letters only)
      if (roomCode.length < 1 || roomCode.length > 6 || !VALID_CODE_CHARS.test(roomCode)) {
        setLocalError('Room code not valid');
        return;
      }

      setLocalError(null);
      setStep('validating');

      // If we have a validation function, use it
      if (onValidateCode) {
        try {
          const isValid = await onValidateCode(roomCode);
          if (isValid) {
            setStep('enter-name');
          } else {
            setLocalError('Room code not valid');
            setStep('enter-code');
          }
        } catch (err) {
          setLocalError('Room code not valid');
          setStep('enter-code');
        }
      } else {
        // No validation function, just proceed to name entry
        setStep('enter-name');
      }
    },
    [roomCode, onValidateCode]
  );

  const handleNameSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmedName = playerName.trim();
      if (trimmedName) {
        setStep('joining');
        onJoinRoom(roomCode, trimmedName);
      }
    },
    [playerName, roomCode, onJoinRoom]
  );

  const displayError = localError || error;

  return (
    <div className={styles.joinRoomContainer}>
      <div className={styles.joinRoomCard}>
        <h2 className={styles.joinRoomTitle}>Join a Game</h2>

        {/* Step 1: Enter Code */}
        {step === 'enter-code' && (
          <form className={styles.joinRoomForm} onSubmit={handleCodeSubmit}>
            <input
              type="text"
              className={styles.joinRoomCodeInput}
              value={roomCode}
              onChange={handleCodeChange}
              placeholder="ENTER CODE"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              aria-label="Room code"
              aria-describedby={displayError ? 'join-room-error' : undefined}
            />

            {displayError && (
              <div id="join-room-error" className={styles.error} role="alert">
                {displayError}
              </div>
            )}
          </form>
        )}

        {/* Step 2: Validating */}
        {step === 'validating' && (
          <div className={styles.joinRoomValidating}>
            <span className={styles.spinnerLarge} />
            <p>Checking room...</p>
          </div>
        )}

        {/* Step 3: Enter Name */}
        {step === 'enter-name' && (
          <form className={styles.joinRoomForm} onSubmit={handleNameSubmit}>
            <p className={styles.joinRoomRoomInfo}>
              Joining room <strong>{roomCode}</strong>
            </p>

            <input
              type="text"
              className={styles.joinRoomNameInput}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              aria-label="Player name"
            />

            <button
              type="submit"
              className={styles.joinRoomButton}
              disabled={!playerName.trim()}
            >
              Confirm
            </button>

            {displayError && (
              <div className={styles.error} role="alert">
                {displayError}
              </div>
            )}
          </form>
        )}

        {/* Step 4: Joining */}
        {step === 'joining' && (
          <div className={styles.joinRoomValidating}>
            <span className={styles.spinnerLarge} />
            <p>Joining game...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinRoom;
