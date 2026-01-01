import { useCallback, useMemo } from 'react';
import { PLAYER_COLORS } from '@/types';
import type { PlayerColor } from '@/types';
import { RoomCode } from './RoomCode';
import { PlayerList, type LobbyPlayerInfo } from './PlayerList';
import { ColorPicker } from './ColorPicker';
import { GameSettings, type LobbyGameSettings } from './GameSettings';
import { StartGameButton } from './StartGameButton';
import styles from './lobby.module.css';

interface GameLobbyProps {
  roomCode: string;
  players: LobbyPlayerInfo[];
  settings: LobbyGameSettings;
  currentPlayerId: string;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  onSettingsChange: (settings: LobbyGameSettings) => void;
  onColorChange: (color: PlayerColor) => void;
  onToggleReady: () => void;
  onKick?: (playerId: string) => void;
}

/**
 * GameLobby - Main lobby layout combining all lobby components
 *
 * Features:
 * - RoomCode display at top
 * - PlayerList on the left
 * - Settings panel on the right
 * - Color picker and ready button in left panel
 * - Start/Leave buttons in footer
 * - Responsive for different screen sizes
 */
export function GameLobby({
  roomCode,
  players,
  settings,
  currentPlayerId,
  isHost,
  onStart,
  onLeave,
  onSettingsChange,
  onColorChange,
  onToggleReady,
  onKick,
}: GameLobbyProps) {
  // Get current player
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  // Calculate available colors (not taken by other players)
  const availableColors = useMemo(() => {
    const takenColors = new Set(
      players
        .filter((p) => p.id !== currentPlayerId && p.color)
        .map((p) => p.color as PlayerColor)
    );
    return PLAYER_COLORS.filter((color) => !takenColors.has(color));
  }, [players, currentPlayerId]);

  // Check if all players are ready (and have colors selected)
  const allPlayersReady = useMemo(
    () =>
      players.length > 0 &&
      players.every((p) => p.isReady && p.color !== null),
    [players]
  );

  // Minimum players required
  // TODO: Change back to 2 for production
  const minPlayers = 1;

  const handleKick = useCallback(
    (playerId: string) => {
      if (isHost && onKick) {
        onKick(playerId);
      }
    },
    [isHost, onKick]
  );

  return (
    <div className={styles.gameLobbyContainer}>
      <header className={styles.gameLobbyHeader}>
        <h1 className={styles.gameLobbyTitle}>Game Lobby</h1>
        <p className={styles.gameLobbySubtitle}>
          Share the room code with friends to invite them
        </p>
      </header>

      <div className={styles.gameLobbyRoomCode}>
        <RoomCode code={roomCode} />
      </div>

      <div className={styles.gameLobbyContent}>
        {/* Left Panel: Players */}
        <div className={styles.gameLobbyPanel}>
          <h2 className={styles.gameLobbyPanelTitle}>
            Players ({players.length}/{settings.playerCount})
          </h2>
          <PlayerList
            players={players}
            currentPlayerId={currentPlayerId}
            maxPlayers={settings.playerCount}
            isHost={isHost}
            onKick={isHost ? handleKick : undefined}
          />

          {/* Color Picker Section */}
          <div className={styles.gameLobbyColorSection}>
            <label className={styles.gameLobbyColorLabel}>Your Color</label>
            <ColorPicker
              selectedColor={currentPlayer?.color || null}
              availableColors={availableColors}
              onChange={onColorChange}
            />
          </div>
        </div>

        {/* Right Panel: Settings */}
        <div className={styles.gameLobbyPanel}>
          <h2 className={styles.gameLobbyPanelTitle}>
            Game Settings {!isHost && '(Host Only)'}
          </h2>
          <GameSettings
            settings={settings}
            onChange={onSettingsChange}
            disabled={!isHost}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.gameLobbyFooter}>
        <button
          type="button"
          className={styles.gameLobbyLeaveButton}
          onClick={onLeave}
        >
          Leave Lobby
        </button>
        <StartGameButton
          isHost={isHost}
          playerCount={players.length}
          minPlayers={minPlayers}
          allPlayersReady={allPlayersReady}
          isReady={currentPlayer?.isReady || false}
          hasColorSelected={currentPlayer?.color !== null}
          onStartGame={onStart}
          onToggleReady={onToggleReady}
        />
      </div>
    </div>
  );
}

export default GameLobby;
