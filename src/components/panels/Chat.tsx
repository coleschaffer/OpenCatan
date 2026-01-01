import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectLocalPlayerId } from '@/game/state/slices/lobbySlice';
import { selectGameSettings } from '@/game/state/slices/gameSlice';
import { GameLog, LogEntry } from './GameLog';
import { Bank } from './Bank';
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

interface ChatProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Game log entries */
  logEntries?: LogEntry[];
  /** Callback when a message is sent */
  onSendMessage?: (text: string) => void;
  /** Alternative callback name */
  onSend?: (text: string) => void;
  /** Whether chat input is disabled */
  disabled?: boolean;
  /** Optional className for additional styling */
  className?: string;
  /** Ignored prop for compatibility */
  myPlayerId?: string;
}

/**
 * Chat - Stacked Log and Chat panel
 *
 * Layout:
 * - Game Log on top (scrollable, no header)
 * - Bank section
 * - Chat section (collapsible, starts collapsed)
 *
 * Features:
 * - Log visible without header
 * - Chat collapsed by default, click header to expand
 * - Message list with player names/colors
 * - Input field at bottom when expanded
 */
export const Chat: React.FC<ChatProps> = ({
  messages,
  logEntries = [],
  onSendMessage,
  onSend,
  disabled = false,
  className,
  myPlayerId: _myPlayerId,
}) => {
  // Support both onSendMessage and onSend prop names
  const handleSendMessage = onSendMessage || onSend || (() => {});
  const [inputValue, setInputValue] = useState('');
  const [chatExpanded, setChatExpanded] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localPlayerId = useSelector(selectLocalPlayerId);
  const gameSettings = useSelector(selectGameSettings);

  /**
   * Auto-scroll chat to bottom on new messages
   */
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length]);

  /**
   * Auto-scroll log to bottom on new entries
   */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  /**
   * Handle sending a message
   */
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !disabled) {
      handleSendMessage(trimmed);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue, handleSendMessage, disabled]);

  /**
   * Handle key press in input
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.chatLogStackedPanel} ${className || ''}`}>
      {/* Game Log Section - Top (no header) */}
      <div className={`${styles.logSection} ${chatExpanded ? styles.logSectionCompressed : ''}`}>
        <div className={styles.logContent} ref={logRef}>
          <GameLog entries={logEntries} myPlayerId={localPlayerId || ''} />
        </div>
      </div>

      {/* Bank Section - Between GameLog and Chat */}
      <Bank compact hideCards={gameSettings?.hideBankCards} />

      {/* Chat Section - Always expanded */}
      <div className={`${styles.chatSection} ${styles.chatSectionExpanded}`}>
        <div className={styles.chatMessages} ref={messagesRef}>
          {messages.length === 0 ? (
            <div className={styles.chatEmpty}>
              No messages yet. Say hi!
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.playerId === localPlayerId;
              const playerColorHex = PLAYER_COLOR_HEX[message.playerColor];

              return (
                <div
                  key={message.id}
                  className={`${styles.chatMessage} ${isMe ? styles.chatMessageMe : ''}`}
                >
                  <span className={styles.chatTimestamp}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                  <div className={styles.chatContent}>
                    <span
                      className={styles.chatPlayerName}
                      style={{ color: playerColorHex }}
                    >
                      {message.playerName}
                      {isMe && <span className={styles.chatYouTag}> (You)</span>}:
                    </span>
                    <span className={styles.chatText}>{message.text}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
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
            className={styles.chatSendButton}
            onClick={handleSend}
            disabled={disabled || !inputValue.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
