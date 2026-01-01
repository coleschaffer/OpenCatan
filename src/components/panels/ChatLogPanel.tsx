// @ts-nocheck
/**
 * ChatLogPanel - Combined vertically stacked Chat and Log panel
 *
 * Displays:
 * - Game Log on top (scrollable event history)
 * - Chat on bottom (messages with input)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { PLAYER_COLOR_HEX, PlayerColor } from '@/types/common';
import styles from './panels.module.css';

/**
 * Chat message data structure
 */
export interface ChatMessage {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  text: string;
}

/**
 * Log entry event types
 */
export type LogEventType =
  | 'dice_roll'
  | 'resource_gain'
  | 'resource_lose'
  | 'build'
  | 'trade'
  | 'dev_card_buy'
  | 'dev_card_play'
  | 'robber_move'
  | 'robber_steal'
  | 'longest_road'
  | 'largest_army'
  | 'turn_start'
  | 'turn_end'
  | 'game_start'
  | 'game_end'
  | 'player_join'
  | 'player_leave'
  | 'knight_action'
  | 'barbarian';

/**
 * Log entry data structure
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  eventType: LogEventType;
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  message: string;
  visibility?: 'public' | 'private' | 'self';
  visibleTo?: string[];
  data?: Record<string, unknown>;
}

interface ChatLogPanelProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Game log entries */
  logEntries: LogEntry[];
  /** Callback when a message is sent */
  onSend?: (text: string) => void;
  /** Whether chat input is disabled */
  disabled?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Event type icons
 */
const getEventIcon = (type: LogEventType): string => {
  const icons: Partial<Record<LogEventType, string>> = {
    dice_roll: '🎲',
    resource_gain: '📥',
    resource_lose: '📤',
    build: '🏗️',
    trade: '🤝',
    dev_card_buy: '🃏',
    dev_card_play: '✨',
    robber_move: '🥷',
    robber_steal: '💰',
    longest_road: '🛤️',
    largest_army: '⚔️',
    turn_start: '▶️',
    game_start: '🎮',
    game_end: '🏆',
  };
  return icons[type] || '•';
};

/**
 * Event type colors
 */
const getEventColor = (type: LogEventType): string => {
  const colors: Partial<Record<LogEventType, string>> = {
    dice_roll: '#64b5f6',
    resource_gain: '#81c784',
    resource_lose: '#e57373',
    build: '#ffb74d',
    trade: '#ba68c8',
    robber_move: '#a1887f',
    robber_steal: '#ef5350',
    longest_road: '#ffd700',
    largest_army: '#ffd700',
    game_start: '#4caf50',
    game_end: '#ff9800',
  };
  return colors[type] || '#888';
};

/**
 * ChatLogPanel - Vertically stacked game log and chat
 */
export const ChatLogPanel: React.FC<ChatLogPanelProps> = ({
  messages,
  logEntries,
  onSend,
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localPlayerId = useSelector(selectLocalPlayerId);

  // Filter visible log entries
  const visibleLogs = logEntries.filter((entry) => {
    if (!entry.visibility || entry.visibility === 'public') return true;
    if (entry.visibility === 'self' && entry.playerId === localPlayerId) return true;
    if (entry.visibility === 'private' && entry.visibleTo?.includes(localPlayerId || '')) return true;
    return false;
  });

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLogs.length]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !disabled && onSend) {
      onSend(trimmed);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue, onSend, disabled]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.chatLogPanel} ${className || ''}`}>
      {/* Game Log Section */}
      <div className={styles.logSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
            </svg>
            Game Log
          </span>
          <span className={styles.sectionCount}>{visibleLogs.length}</span>
        </div>
        <div className={styles.logEntries} ref={logRef}>
          {visibleLogs.length === 0 ? (
            <div className={styles.emptyMessage}>No events yet</div>
          ) : (
            visibleLogs.map((entry) => (
              <div
                key={entry.id}
                className={styles.logEntry}
                style={{ '--event-color': getEventColor(entry.eventType) } as React.CSSProperties}
              >
                <span className={styles.logTime}>{formatTimestamp(entry.timestamp)}</span>
                <span className={styles.logIcon}>{getEventIcon(entry.eventType)}</span>
                <span className={styles.logContent}>
                  <span
                    className={styles.logPlayer}
                    style={{ color: PLAYER_COLOR_HEX[entry.playerColor] }}
                  >
                    {entry.playerName}
                  </span>
                  {' '}
                  <span className={styles.logMessage}>{entry.message}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className={styles.chatSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
            Chat
          </span>
          <span className={styles.sectionCount}>{messages.length}</span>
        </div>
        <div className={styles.chatMessages} ref={chatRef}>
          {messages.length === 0 ? (
            <div className={styles.emptyMessage}>No messages yet</div>
          ) : (
            messages.map((message) => {
              const isMe = message.playerId === localPlayerId;
              return (
                <div
                  key={message.id}
                  className={`${styles.chatMessage} ${isMe ? styles.chatMessageMe : ''}`}
                >
                  <span className={styles.chatTime}>{formatTimestamp(message.timestamp)}</span>
                  <span
                    className={styles.chatPlayerName}
                    style={{ color: PLAYER_COLOR_HEX[message.playerColor] }}
                  >
                    {message.playerName}
                    {isMe && <span className={styles.youTag}> (you)</span>}:
                  </span>
                  <span className={styles.chatText}>{message.text}</span>
                </div>
              );
            })
          )}
        </div>
        <div className={styles.chatInputArea}>
          <input
            ref={inputRef}
            type="text"
            className={styles.chatInput}
            placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={200}
          />
          <button
            className={styles.chatSendBtn}
            onClick={handleSend}
            disabled={disabled || !inputValue.trim()}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatLogPanel;
