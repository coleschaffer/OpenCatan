import React, { useEffect, useRef } from 'react';
import styles from './GameLog.module.css';
import { PlayerColor } from './PlayerCard';
import type { LogEntry as GlobalLogEntry, LogEntryType } from '@/types';

/**
 * Re-export LogEntry type from types (uses 'type' field with hyphenated values)
 */
export type LogEntry = GlobalLogEntry;

/**
 * Legacy event type alias for backwards compatibility
 */
export type LogEventType = LogEntryType;

/**
 * Log entry visibility
 */
export type LogVisibility = 'public' | 'private' | 'self' | 'all' | 'involved';

interface GameLogProps {
  /** Log entries to display */
  entries: LogEntry[];
  /** Current player's ID (for visibility filtering) */
  myPlayerId: string;
}

/**
 * Player color mapping
 */
const playerColorMap: Record<PlayerColor, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  orange: '#fb8c00',
  white: '#f5f5f5',
  green: '#43a047',
  purple: '#8e24aa',
  black: '#424242',
  bronze: '#cd7f32',
  gold: '#ffd700',
  silver: '#c0c0c0',
  pink: '#ec407a',
  mysticblue: '#5c6bc0',
};

/**
 * Get asset icon path based on log entry type and player color
 */
const getIconPath = (type: string | undefined, playerColor?: PlayerColor): string | null => {
  if (!type) return null;

  const color = playerColor || 'red';

  // Building actions - use player-colored building icons
  if (type === 'built-settlement' || type === 'build') {
    return `/assets/buildings/settlement_${color}.svg`;
  }
  if (type === 'built-city') {
    return `/assets/buildings/city_${color}.svg`;
  }
  if (type === 'built-road') {
    return `/assets/buildings/road_${color}.svg`;
  }

  // Trading
  if (type.includes('trade')) {
    return '/assets/icons/icon_trade.svg';
  }

  // Robber
  if (type.includes('robber')) {
    return '/assets/icons/icon_robber.svg';
  }

  // Dev cards
  if (type === 'bought-dev-card') {
    return '/assets/icons/icon_buy_dev_card.svg';
  }

  // Achievements
  if (type === 'longest-road') {
    return '/assets/icons/icon_longest_road.svg';
  }
  if (type === 'largest-army') {
    return '/assets/icons/icon_largest_army.svg';
  }

  // Victory/trophy
  if (type === 'victory' || type === 'game-end') {
    return '/assets/icons/icon_trophy.svg';
  }

  // Knights
  if (type.includes('knight')) {
    return `/assets/pieces/knight_level1_active_${color}.svg`;
  }

  // Dice roll
  if (type === 'dice-roll') {
    return '/assets/dice/dice_6.svg';
  }

  return null;
};

/**
 * Strip player name from message to avoid double-display
 */
const stripPlayerName = (message: string, playerName?: string): string => {
  if (!playerName || !message) return message;
  // Remove player name from start of message (with possible space)
  const patterns = [
    new RegExp(`^${playerName}\\s+`, 'i'),
    new RegExp(`^${playerName}:?\\s*`, 'i'),
  ];
  let result = message;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
};

/**
 * GameLog - Event log panel
 *
 * Displays game events with filtering based on visibility.
 * Auto-scrolls to the latest entry. Uses SVG icons from assets.
 */
export const GameLog: React.FC<GameLogProps> = ({ entries, myPlayerId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Filter entries based on visibility rules
   */
  const visibleEntries = entries.filter((entry) => {
    const visibility = entry.visibility;
    if (visibility === 'public' || visibility === 'all') return true;
    if (visibility === 'self' && entry.playerId === myPlayerId) return true;
    if (visibility === 'involved') {
      return (
        entry.playerId === myPlayerId ||
        entry.data?.victimId === myPlayerId ||
        entry.data?.tradePartnerId === myPlayerId
      );
    }
    if (visibility === 'private') {
      if (Array.isArray(entry.data?.visibleTo)) {
        return (entry.data.visibleTo as string[]).includes(myPlayerId);
      }
    }
    return false;
  });

  /**
   * Auto-scroll to bottom on new entries
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleEntries.length]);

  return (
    <div className={styles.gameLog}>
      <div className={styles.entries} ref={scrollRef}>
        {visibleEntries.length === 0 && (
          <div className={styles.empty}>No events yet</div>
        )}

        {visibleEntries.map((entry) => {
          const playerColor = entry.playerColor ? playerColorMap[entry.playerColor] : '#888';
          const iconPath = getIconPath(entry.type, entry.playerColor);
          const cleanMessage = stripPlayerName(entry.message, entry.playerName);

          return (
            <div
              key={entry.id}
              className={`${styles.entry} ${entry.playerId === myPlayerId ? styles.myEntry : ''}`}
            >
              {iconPath && (
                <img
                  src={iconPath}
                  alt=""
                  className={styles.icon}
                />
              )}
              <span className={styles.content}>
                {entry.playerName && (
                  <>
                    <span
                      className={styles.playerName}
                      style={{ color: playerColor }}
                    >
                      {entry.playerName}
                    </span>{' '}
                  </>
                )}
                <span className={styles.message}>{cleanMessage}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameLog;
