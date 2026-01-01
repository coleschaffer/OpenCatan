/**
 * VictoryPointBreakdown - Detailed VP breakdown for a player
 *
 * Shows where each victory point came from:
 * - Settlements (1 VP each)
 * - Cities (2 VP each)
 * - Longest Road (2 VP if held)
 * - Largest Army (2 VP if held)
 * - Victory Point Cards (revealed)
 * - Metropolis (Cities & Knights, 2 VP each)
 */

import React from 'react';
import type { PlayerColor } from '../../types/common';
import type { VPBreakdown } from '../../game/engine/statsTracker';
import styles from './victory.module.css';

/**
 * Props for VictoryPointBreakdown component
 */
export interface VictoryPointBreakdownProps {
  /** Player name to display in header */
  playerName: string;
  /** Player color for styling */
  playerColor: PlayerColor;
  /** VP breakdown data */
  breakdown: VPBreakdown;
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
 * Icon components for each VP source
 */
const SettlementIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L4 9v12h16V9L12 3zm6 16h-4v-5h-4v5H6v-9.5l6-4.5 6 4.5V19z" />
  </svg>
);

const CityIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z" />
  </svg>
);

const RoadIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5zm-4 14h-2v-4h2v4zm0-6h-2V9h2v4zm0-6h-2V5h2v2z" />
  </svg>
);

const ArmyIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L11 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const CardIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const MetropolisIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
  </svg>
);

/**
 * Single VP source row
 */
interface VPRowProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  points: number;
  color?: string;
}

const VPRow: React.FC<VPRowProps> = ({ icon, label, count, points, color }) => {
  if (points === 0) return null;

  return (
    <div className={styles.vpRow}>
      <div className={styles.vpRowIcon} style={color ? { color } : undefined}>
        {icon}
      </div>
      <div className={styles.vpRowLabel}>
        {label}
        {count !== undefined && count > 1 && (
          <span className={styles.vpRowCount}> ({count})</span>
        )}
      </div>
      <div className={styles.vpRowValue}>
        +{points} VP
      </div>
    </div>
  );
};

/**
 * VictoryPointBreakdown component displays detailed VP sources
 */
export const VictoryPointBreakdown: React.FC<VictoryPointBreakdownProps> = ({
  playerName,
  playerColor,
  breakdown,
}) => {
  const colorHex = getPlayerColorHex(playerColor);

  const hasAnyPoints =
    breakdown.settlements > 0 ||
    breakdown.cities > 0 ||
    breakdown.longestRoad > 0 ||
    breakdown.largestArmy > 0 ||
    breakdown.victoryPointCards > 0 ||
    breakdown.metropolis > 0;

  if (!hasAnyPoints) {
    return null;
  }

  return (
    <div className={styles.vpBreakdownSection}>
      <h2 className={styles.sectionTitle}>
        <span style={{ color: colorHex }}>{playerName}</span>'s Victory Points
      </h2>

      <div className={styles.vpBreakdownCard}>
        <VPRow
          icon={<SettlementIcon />}
          label="Settlements"
          count={breakdown.settlementCount}
          points={breakdown.settlements}
          color="#8b4513"
        />

        <VPRow
          icon={<CityIcon />}
          label="Cities"
          count={breakdown.cityCount}
          points={breakdown.cities}
          color="#4a5568"
        />

        {breakdown.longestRoad > 0 && (
          <VPRow
            icon={<RoadIcon />}
            label="Longest Road"
            points={breakdown.longestRoad}
            color="#d69e2e"
          />
        )}

        {breakdown.largestArmy > 0 && (
          <VPRow
            icon={<ArmyIcon />}
            label="Largest Army"
            points={breakdown.largestArmy}
            color="#9f7aea"
          />
        )}

        {breakdown.victoryPointCards > 0 && (
          <VPRow
            icon={<CardIcon />}
            label="Victory Point Cards"
            count={breakdown.vpCardCount}
            points={breakdown.victoryPointCards}
            color="#3182ce"
          />
        )}

        {breakdown.metropolis > 0 && (
          <VPRow
            icon={<MetropolisIcon />}
            label="Metropolis"
            count={breakdown.metropolisCount}
            points={breakdown.metropolis}
            color="#e53e3e"
          />
        )}

        {/* Divider */}
        <div className={styles.vpDivider} />

        {/* Total */}
        <div className={styles.vpTotalRow}>
          <span className={styles.vpTotalLabel}>Total</span>
          <span className={styles.vpTotalValue}>{breakdown.total} VP</span>
        </div>
      </div>
    </div>
  );
};

export default VictoryPointBreakdown;
