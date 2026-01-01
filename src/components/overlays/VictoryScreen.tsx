/**
 * VictoryScreen - Full-screen victory overlay for OpenCatan
 *
 * Displays when a player wins the game with:
 * - Winner announcement with celebration animation
 * - Final scoreboard with all players ranked
 * - Victory point breakdown for winner
 * - Game statistics summary
 * - Navigation options
 */

import React, { useEffect, useState, useMemo } from 'react';
import type { PlayerColor } from '../../types';
import type { VPBreakdown, GameStats, PlayerStats } from '../../game/engine/statsTracker';
import { FinalScoreboard } from './FinalScoreboard';
import { VictoryPointBreakdown } from './VictoryPointBreakdown';
import { GameStatistics } from './GameStatistics';
import { DiceDistribution } from './DiceDistribution';
import styles from './victory.module.css';

/**
 * Player data for victory screen
 */
export interface VictoryPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  victoryPoints: number;
  vpBreakdown: VPBreakdown;
}

/**
 * Extended game statistics for victory screen
 */
export interface VictoryGameStats extends GameStats {
  playerStats: Record<string, PlayerStats>;
}

/**
 * Props for VictoryScreen component
 */
export interface VictoryScreenProps {
  /** Whether the victory screen is visible */
  isOpen: boolean;
  /** The winning player */
  winner: VictoryPlayer;
  /** All players with their final stats */
  players: VictoryPlayer[];
  /** Overall game statistics */
  stats: VictoryGameStats;
  /** Called when returning to lobby */
  onReturnToLobby: () => void;
  /** Called when creating a new game with same players */
  onCreateNewRoom: () => void;
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
 * Confetti particle component
 */
const Confetti: React.FC<{ color: string; delay: number; left: number }> = ({
  color,
  delay,
  left,
}) => (
  <div
    className={styles.confetti}
    style={{
      backgroundColor: color,
      left: `${left}%`,
      animationDelay: `${delay}s`,
    }}
  />
);

/**
 * Generate confetti particles
 */
function generateConfetti(count: number = 50): React.ReactNode[] {
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1', '#dda0dd', '#f8b500'];
  const particles: React.ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 3;
    const left = Math.random() * 100;

    particles.push(
      <Confetti key={`confetti-${i}`} color={color} delay={delay} left={left} />
    );
  }

  return particles;
}

/**
 * Trophy icon component
 */
const TrophyIcon: React.FC = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.trophyIcon}
  >
    {/* Trophy cup */}
    <path
      d="M8 21h8M12 17v4"
      stroke="#fbbf24"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 4h10l-1 8a4 4 0 01-8 0L7 4z"
      fill="#fbbf24"
      stroke="#f59e0b"
      strokeWidth="1.5"
    />
    {/* Trophy handles */}
    <path
      d="M5 4a2 2 0 00-2 2v1a2 2 0 002 2h2M19 4a2 2 0 012 2v1a2 2 0 01-2 2h-2"
      stroke="#f59e0b"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Star on trophy */}
    <path
      d="M12 7l.9 1.8 2 .3-1.5 1.4.4 2-1.8-.9-1.8.9.4-2-1.5-1.4 2-.3L12 7z"
      fill="#fff"
      opacity="0.8"
    />
  </svg>
);

/**
 * VictoryScreen component displays the end game results
 */
export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  isOpen,
  winner,
  players,
  stats,
  onReturnToLobby,
  onCreateNewRoom,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [activeTab, setActiveTab] = useState<'scores' | 'stats'>('scores');

  // Sort players by victory points
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.victoryPoints - a.victoryPoints);
  }, [players]);

  const winnerColorHex = getPlayerColorHex(winner.color);

  // Generate confetti particles once
  const confettiParticles = useMemo(() => generateConfetti(60), []);

  // Play sound effect on mount (placeholder - integrate with audio system)
  useEffect(() => {
    if (isOpen) {
      // Play victory sound
      // audioManager.play('victory');

      // Stop confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset confetti when screen opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      {/* Confetti animation */}
      {showConfetti && (
        <div className={styles.confettiContainer}>{confettiParticles}</div>
      )}

      <div className={styles.container}>
        {/* Winner Announcement */}
        <div className={styles.winnerSection}>
          <div className={styles.trophyContainer}>
            <TrophyIcon />
          </div>
          <h1 className={styles.winnerTitle}>
            <span className={styles.trophy}>&#127942;</span>
            <span
              className={styles.winnerName}
              style={{ color: winnerColorHex }}
            >
              {winner.name}
            </span>
            <span className={styles.winsText}>WINS!</span>
            <span className={styles.trophy}>&#127942;</span>
          </h1>
          <p className={styles.winnerPoints}>
            {winner.victoryPoints} Victory Points
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'scores' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('scores')}
          >
            Final Scores
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'stats' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Game Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'scores' ? (
            <>
              {/* Final Scoreboard */}
              <FinalScoreboard
                players={sortedPlayers}
                winnerId={winner.id}
              />

              {/* Winner's VP Breakdown */}
              <VictoryPointBreakdown
                playerName={winner.name}
                playerColor={winner.color}
                breakdown={winner.vpBreakdown}
              />
            </>
          ) : (
            <>
              {/* Game Statistics */}
              <GameStatistics stats={stats} />

              {/* Dice Distribution */}
              <DiceDistribution
                rollCounts={stats.diceRolls}
                totalRolls={stats.totalTurns}
              />
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.lobbyButton}
            onClick={onReturnToLobby}
          >
            Return to Lobby
          </button>
          <button
            type="button"
            className={styles.newGameButton}
            onClick={onCreateNewRoom}
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryScreen;
