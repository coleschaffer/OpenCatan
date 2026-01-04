import React, { useState } from 'react';
import { PlayerCard, PlayerData } from './PlayerCard';
import styles from './PlayerPanel.module.css';

interface PlayerPanelProps {
  /** Array of all players in the game */
  players: PlayerData[];
  /** ID of the player whose turn it currently is */
  currentPlayerId: string;
  /** ID of the local player (me) */
  myPlayerId: string;
}

/**
 * PlayerPanel - Side panel showing all players
 *
 * Renders PlayerCard components for each player in the game.
 * Highlights the current turn player and provides a collapsed
 * view for mobile devices.
 *
 * @param players - Array of all players
 * @param currentPlayerId - ID of current turn player
 * @param myPlayerId - ID of local player
 */
export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  players,
  currentPlayerId,
  myPlayerId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sort players: current player first, then by turn order (keep original order)
  // Local player is visually highlighted but stays in position
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayerId) return -1;
    if (b.id === currentPlayerId) return 1;
    return 0;
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <div className={`${styles.playerPanel} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Players</h2>
        <button
          className={styles.collapseButton}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand player panel' : 'Collapse player panel'}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            className={isCollapsed ? styles.rotated : ''}
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </div>

      {/* Collapsed view - only show current player mini info */}
      {isCollapsed && currentPlayer && (
        <div className={styles.collapsedContent}>
          <div
            className={styles.miniPlayer}
            style={
              {
                '--player-color':
                  currentPlayer.color === 'red'
                    ? '#e53935'
                    : currentPlayer.color === 'blue'
                      ? '#1e88e5'
                      : currentPlayer.color === 'orange'
                        ? '#fb8c00'
                        : '#666',
              } as React.CSSProperties
            }
          >
            <div className={styles.miniColorDot} />
            <span className={styles.miniName}>{currentPlayer.name}</span>
            <span className={styles.miniVP}>{currentPlayer.victoryPoints} VP</span>
          </div>
          <div className={styles.playerCount}>
            {players.length} players
          </div>
        </div>
      )}

      {/* Full player list */}
      {!isCollapsed && (
        <div className={styles.playerList}>
          {sortedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayerId}
              isMe={player.id === myPlayerId}
            />
          ))}
        </div>
      )}

      {/* Player count footer */}
      {!isCollapsed && players && (
        <div className={styles.footer}>
          <span className={styles.playerCountText}>
            {players.filter((p) => p.isConnected).length}/{players.length} online
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;
