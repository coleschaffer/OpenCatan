/**
 * FinalScoreboard - Displays final player rankings at game end
 *
 * Shows all players ranked by victory points with:
 * - Progress bars showing relative scores
 * - Player colors
 * - Winner highlight (gold border/glow)
 * - Tied players indication
 */

import React from 'react';
import type { PlayerColor } from '../../types/common';
import type { VPBreakdown } from '../../game/engine/statsTracker';
import styles from './victory.module.css';

/**
 * Player data for scoreboard display
 */
export interface ScoreboardPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  victoryPoints: number;
  vpBreakdown?: VPBreakdown;
}

/**
 * Props for FinalScoreboard component
 */
export interface FinalScoreboardProps {
  /** Players sorted by victory points (highest first) */
  players: ScoreboardPlayer[];
  /** ID of the winning player */
  winnerId: string;
}

/**
 * Get hex color for player color
 */
function getPlayerColorHex(color: PlayerColor): string {
  const colors: Record<PlayerColor, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    orange: '#fb8c00',
    white: '#f5f5f5',
    green: '#43a047',
    purple: '#8e24aa',
    black: '#424242',
    bronze: '#a1887f',
    gold: '#ffd700',
    silver: '#b0bec5',
    pink: '#ec407a',
    mysticblue: '#4fc3f7',
  };
  return colors[color] || '#888888';
}

/**
 * Get position medal emoji for top 3
 */
function getPositionMedal(position: number): string {
  switch (position) {
    case 1:
      return ''; // Winner gets trophy elsewhere
    case 2:
      return ''; // Silver
    case 3:
      return ''; // Bronze
    default:
      return '';
  }
}

/**
 * FinalScoreboard component displays player rankings
 */
export const FinalScoreboard: React.FC<FinalScoreboardProps> = ({
  players,
  winnerId,
}) => {
  if (players.length === 0) {
    return null;
  }

  const maxScore = players[0]?.victoryPoints || 10;

  // Check for ties
  const getTieGroup = (player: ScoreboardPlayer, index: number): number => {
    let group = 1;
    for (let i = 0; i < index; i++) {
      if (players[i].victoryPoints !== players[i + 1]?.victoryPoints) {
        group = i + 2;
      }
    }
    return group;
  };

  return (
    <div className={styles.scoreboardSection}>
      <h2 className={styles.sectionTitle}>Final Scores</h2>
      <div className={styles.scoreboard}>
        {players.map((player, index) => {
          const colorHex = getPlayerColorHex(player.color);
          const isWinner = player.id === winnerId;
          const barWidth = (player.victoryPoints / maxScore) * 100;
          const position = index + 1;

          // Check if tied with previous player
          const isTied = index > 0 && players[index - 1].victoryPoints === player.victoryPoints;
          const displayPosition = isTied ? getTieGroup(player, index) : position;

          return (
            <div
              key={player.id}
              className={`${styles.scoreboardRow} ${isWinner ? styles.scoreboardRowWinner : ''}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Position */}
              <div className={styles.positionContainer}>
                <span className={`${styles.position} ${isWinner ? styles.positionWinner : ''}`}>
                  {isTied ? 'T' : ''}{displayPosition}
                </span>
              </div>

              {/* Player color indicator */}
              <div
                className={styles.playerColorIndicator}
                style={{ backgroundColor: colorHex }}
              />

              {/* Player info */}
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>
                  {player.name}
                  {isWinner && <span className={styles.winnerBadge}>Winner</span>}
                </span>

                {/* Score bar */}
                <div className={styles.scoreBarContainer}>
                  <div
                    className={`${styles.scoreBarFill} ${isWinner ? styles.scoreBarFillWinner : ''}`}
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: isWinner ? '#fbbf24' : colorHex,
                    }}
                  />
                </div>
              </div>

              {/* Victory points */}
              <div className={styles.vpContainer}>
                <span className={`${styles.vpValue} ${isWinner ? styles.vpValueWinner : ''}`}>
                  {player.victoryPoints}
                </span>
                <span className={styles.vpLabel}>VP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinalScoreboard;
