import { COLOR_CONFIG } from '@/types';
import type { PlayerColor } from '@/types';
import styles from './lobby.module.css';

/**
 * LobbyPlayer - Player info for the lobby
 */
export interface LobbyPlayerInfo {
  id: string;
  name: string;
  color: PlayerColor | null;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
}

interface PlayerListProps {
  players: LobbyPlayerInfo[];
  currentPlayerId: string;
  maxPlayers: number;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

/**
 * PlayerList - List of players in the game lobby
 *
 * Features:
 * - Shows all players currently in the lobby
 * - Show: name, color swatch, ready status, host badge, connection status
 * - Current player highlighted
 * - Empty slots shown as "Waiting for player..."
 * - Host can kick other players
 */
export function PlayerList({
  players,
  currentPlayerId,
  maxPlayers,
  isHost,
  onKick,
}: PlayerListProps) {
  // Create array of slots based on max players
  const slots = Array.from({ length: maxPlayers }, (_, index) => {
    const player = players[index] || null;
    return player;
  });

  return (
    <div className={styles.playerListContainer} role="list" aria-label="Players in lobby">
      {slots.map((player, index) => (
        <PlayerSlot
          key={player?.id || `empty-${index}`}
          player={player}
          isCurrentPlayer={player?.id === currentPlayerId}
          isHost={isHost}
          onKick={onKick}
        />
      ))}
    </div>
  );
}

interface PlayerSlotProps {
  player: LobbyPlayerInfo | null;
  isCurrentPlayer: boolean;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

/**
 * PlayerSlot - Single player entry in the lobby player list
 */
function PlayerSlot({
  player,
  isCurrentPlayer,
  isHost,
  onKick,
}: PlayerSlotProps) {
  if (!player) {
    return (
      <div className={`${styles.playerSlot} ${styles.playerSlotEmpty}`} role="listitem">
        <div className={`${styles.playerColorSwatch} ${styles.playerColorSwatchEmpty}`} />
        <div className={styles.playerInfo}>
          <span className={styles.playerEmptyText}>Waiting for player...</span>
        </div>
      </div>
    );
  }

  const colorInfo = player.color ? COLOR_CONFIG[player.color] : null;

  return (
    <div
      className={`${styles.playerSlot} ${isCurrentPlayer ? styles.playerSlotCurrent : ''}`}
      role="listitem"
    >
      <div
        className={styles.playerColorSwatch}
        style={{ backgroundColor: colorInfo?.hex || 'transparent' }}
        title={colorInfo?.name || 'No color selected'}
      />
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>
          {player.name}
          {player.isHost && <span className={styles.playerBadgeHost}>Host</span>}
          {isCurrentPlayer && <span className={styles.playerBadgeYou}>You</span>}
        </div>
        {!player.isConnected && (
          <div className={`${styles.playerConnectionStatus} ${styles.playerDisconnected}`}>
            Disconnected
          </div>
        )}
      </div>
      <div className={styles.playerStatusSection}>
        <span
          className={
            player.isReady
              ? styles.playerReadyStatusReady
              : styles.playerReadyStatusNotReady
          }
        >
          {player.isReady ? 'Ready' : 'Not Ready'}
        </span>
        {isHost && !isCurrentPlayer && onKick && (
          <button
            type="button"
            className={styles.playerKickButton}
            onClick={() => onKick(player.id)}
            aria-label={`Kick ${player.name}`}
          >
            Kick
          </button>
        )}
      </div>
    </div>
  );
}

export default PlayerList;
