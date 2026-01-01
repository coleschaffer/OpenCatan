/**
 * GameStatistics - End game statistics summary
 *
 * Displays overall game statistics:
 * - Total turns played
 * - Game duration
 * - Most common dice roll
 * - Total resources collected
 * - Trades made
 * - Development cards bought/played
 */

import React from 'react';
import type { GameStats } from '../../game/engine/statsTracker';
import { formatDuration } from '../../game/engine/statsTracker';
import styles from './victory.module.css';

/**
 * Props for GameStatistics component
 */
export interface GameStatisticsProps {
  /** Game statistics data */
  stats: GameStats;
}

/**
 * Stat card component for individual statistics
 */
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  sublabel,
  highlight = false,
}) => (
  <div className={`${styles.statCard} ${highlight ? styles.statCardHighlight : ''}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statValue}>{value}</div>
    <div className={styles.statLabel}>{label}</div>
    {sublabel && <div className={styles.statSublabel}>{sublabel}</div>}
  </div>
);

/**
 * Icon components for statistics
 */
const TurnsIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const DiceIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
  </svg>
);

const ResourceIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM13.25 7l-1.5 2.25L9.5 6l-4 6h13l-5.25-5z" />
  </svg>
);

const TradeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const CardIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const KnightIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H8l4-4 4 4h-2v4z" />
  </svg>
);

const RobberIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />
  </svg>
);

/**
 * GameStatistics component displays end game statistics
 */
export const GameStatistics: React.FC<GameStatisticsProps> = ({ stats }) => {
  const formattedDuration = formatDuration(stats.gameDuration);

  // Calculate total resources
  const totalResources = Object.values(stats.resourcesCollected).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className={styles.gameStatsSection}>
      <h2 className={styles.sectionTitle}>Game Statistics</h2>

      <div className={styles.statsGrid}>
        <StatCard
          icon={<TurnsIcon />}
          value={stats.totalTurns}
          label="Total Turns"
        />

        <StatCard
          icon={<ClockIcon />}
          value={formattedDuration}
          label="Game Duration"
        />

        <StatCard
          icon={<DiceIcon />}
          value={stats.mostCommonRoll.value}
          label="Most Common Roll"
          sublabel={`(${stats.mostCommonRoll.count} times)`}
          highlight
        />

        <StatCard
          icon={<ResourceIcon />}
          value={totalResources}
          label="Resources Collected"
        />

        <StatCard
          icon={<TradeIcon />}
          value={stats.tradesCompleted}
          label="Trades Made"
        />

        <StatCard
          icon={<CardIcon />}
          value={stats.developmentCardsBought}
          label="Dev Cards Bought"
        />

        <StatCard
          icon={<KnightIcon />}
          value={stats.knightsPlayed}
          label="Knights Played"
        />

        <StatCard
          icon={<RobberIcon />}
          value={stats.robberMoves}
          label="Robber Moves"
        />
      </div>

      {/* Resource breakdown */}
      <div className={styles.resourceBreakdown}>
        <h3 className={styles.subsectionTitle}>Resources Collected</h3>
        <div className={styles.resourceGrid}>
          {Object.entries(stats.resourcesCollected).map(([resource, count]) => (
            <div key={resource} className={styles.resourceItem}>
              <div className={`${styles.resourceIcon} ${styles[`resource${resource.charAt(0).toUpperCase() + resource.slice(1)}`]}`} />
              <span className={styles.resourceName}>{resource}</span>
              <span className={styles.resourceCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameStatistics;
