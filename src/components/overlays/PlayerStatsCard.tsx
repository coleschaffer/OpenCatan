/**
 * PlayerStatsCard - Individual player statistics display
 *
 * Shows detailed statistics for a single player:
 * - Resources collected
 * - Trades made (accepted/offered)
 * - Roads/settlements/cities built
 * - Development cards played
 * - Expandable for each player
 */

import React, { useState } from 'react';
import type { PlayerColor, ResourceType } from '../../types/common';
import type { PlayerStats } from '../../game/engine/statsTracker';
import styles from './victory.module.css';

/**
 * Props for PlayerStatsCard component
 */
export interface PlayerStatsCardProps {
  /** Player ID */
  playerId: string;
  /** Player display name */
  playerName: string;
  /** Player color */
  playerColor: PlayerColor;
  /** Player statistics */
  stats: PlayerStats;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Whether this player won the game */
  isWinner?: boolean;
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
 * Resource color mapping
 */
const RESOURCE_COLORS: Record<ResourceType, string> = {
  brick: '#c0392b',
  lumber: '#27ae60',
  ore: '#7f8c8d',
  grain: '#f1c40f',
  wool: '#9b59b6',
};

/**
 * Stat row component
 */
interface StatRowProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, icon }) => (
  <div className={styles.playerStatRow}>
    {icon && <span className={styles.playerStatIcon}>{icon}</span>}
    <span className={styles.playerStatLabel}>{label}</span>
    <span className={styles.playerStatValue}>{value}</span>
  </div>
);

/**
 * Chevron icon for expand/collapse
 */
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    }}
  >
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

/**
 * PlayerStatsCard component displays individual player statistics
 */
export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
  playerId,
  playerName,
  playerColor,
  stats,
  defaultExpanded = false,
  isWinner = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colorHex = getPlayerColorHex(playerColor);

  return (
    <div
      className={`${styles.playerStatsCard} ${isWinner ? styles.playerStatsCardWinner : ''}`}
    >
      {/* Header - always visible, clickable to expand */}
      <button
        type="button"
        className={styles.playerStatsHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div
          className={styles.playerStatsColorDot}
          style={{ backgroundColor: colorHex }}
        />
        <span className={styles.playerStatsName}>
          {playerName}
          {isWinner && <span className={styles.winnerTag}>Winner</span>}
        </span>
        <span className={styles.playerStatsSummary}>
          {stats.totalResourcesCollected} resources
        </span>
        <ChevronIcon expanded={isExpanded} />
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className={styles.playerStatsContent}>
          {/* Resources collected */}
          <div className={styles.playerStatsSection}>
            <h4 className={styles.playerStatsSubtitle}>Resources Collected</h4>
            <div className={styles.resourceBreakdownMini}>
              {Object.entries(stats.resourcesCollected).map(([resource, count]) => (
                <div key={resource} className={styles.resourceMiniItem}>
                  <div
                    className={styles.resourceMiniDot}
                    style={{ backgroundColor: RESOURCE_COLORS[resource as ResourceType] }}
                  />
                  <span className={styles.resourceMiniLabel}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </span>
                  <span className={styles.resourceMiniValue}>{count}</span>
                </div>
              ))}
            </div>
            <div className={styles.resourceTotal}>
              Total: {stats.totalResourcesCollected}
            </div>
          </div>

          {/* Building stats */}
          <div className={styles.playerStatsSection}>
            <h4 className={styles.playerStatsSubtitle}>Buildings Placed</h4>
            <div className={styles.buildingStats}>
              <StatRow label="Roads" value={stats.roadsBuilt} />
              <StatRow label="Settlements" value={stats.settlementsBuilt} />
              <StatRow label="Cities" value={stats.citiesBuilt} />
            </div>
          </div>

          {/* Trading stats */}
          <div className={styles.playerStatsSection}>
            <h4 className={styles.playerStatsSubtitle}>Trading</h4>
            <div className={styles.tradeStats}>
              <StatRow label="Total Trades" value={stats.tradesMade} />
              <StatRow label="Initiated" value={stats.tradesInitiated} />
              <StatRow label="Accepted" value={stats.tradesReceived} />
            </div>
          </div>

          {/* Development cards */}
          <div className={styles.playerStatsSection}>
            <h4 className={styles.playerStatsSubtitle}>Development Cards</h4>
            <div className={styles.devCardStats}>
              <StatRow label="Bought" value={stats.devCardsBought} />
              <StatRow label="Played" value={stats.devCardsPlayed} />
              <StatRow label="Knights" value={stats.knightsPlayed} />
            </div>
          </div>

          {/* Longest road */}
          {stats.longestRoadAchieved > 0 && (
            <div className={styles.playerStatsSection}>
              <h4 className={styles.playerStatsSubtitle}>Achievements</h4>
              <StatRow
                label="Longest Road"
                value={`${stats.longestRoadAchieved} segments`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Component to display all players' stats in a list
 */
export interface AllPlayersStatsProps {
  players: Array<{
    id: string;
    name: string;
    color: PlayerColor;
  }>;
  stats: Record<string, PlayerStats>;
  winnerId: string;
}

export const AllPlayersStats: React.FC<AllPlayersStatsProps> = ({
  players,
  stats,
  winnerId,
}) => {
  return (
    <div className={styles.allPlayersStats}>
      <h3 className={styles.sectionTitle}>Player Statistics</h3>
      <div className={styles.playerStatsList}>
        {players.map((player) => (
          <PlayerStatsCard
            key={player.id}
            playerId={player.id}
            playerName={player.name}
            playerColor={player.color}
            stats={stats[player.id]}
            isWinner={player.id === winnerId}
            defaultExpanded={player.id === winnerId}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerStatsCard;
