import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatPanel.module.css';
import { PlayerColor } from './PlayerCard';

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

interface ChatPanelProps {
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Callback when a message is sent */
  onSend: (text: string) => void;
  /** Current player's ID */
  myPlayerId?: string;
  /** Whether the chat input is disabled */
  disabled?: boolean;
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
  black: '#757575',
  bronze: '#cd7f32',
  gold: '#ffd700',
  silver: '#c0c0c0',
  pink: '#ec407a',
  mysticblue: '#5c6bc0',
};

/**
 * ChatPanel - Chat messages panel
 *
 * Displays chat messages with player colors and provides
 * an input field for sending new messages. Supports sending
 * on Enter key press.
 *
 * @param messages - Chat messages to display
 * @param onSend - Send message callback
 * @param myPlayerId - Current player's ID
 * @param disabled - Whether input is disabled
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSend,
  myPlayerId,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Auto-scroll to bottom on new messages
   */
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length]);

  /**
   * Handle sending a message
   */
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue, onSend, disabled]);

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
    <div className={styles.chatPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Chat</h3>
        <span className={styles.messageCount}>{messages.length} messages</span>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.length === 0 && (
          <div className={styles.empty}>No messages yet. Say hi!</div>
        )}

        {messages.map((message) => {
          const playerColor = playerColorMap[message.playerColor];
          const isMe = message.playerId === myPlayerId;

          return (
            <div
              key={message.id}
              className={`${styles.message} ${isMe ? styles.myMessage : ''}`}
            >
              <span className={styles.timestamp}>
                {formatTimestamp(message.timestamp)}
              </span>
              <div className={styles.content}>
                <span
                  className={styles.playerName}
                  style={{ color: playerColor }}
                >
                  {message.playerName}
                  {isMe && <span className={styles.youTag}> (You)</span>}:
                </span>
                <span className={styles.text}>{message.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={200}
        />
        <button
          className={styles.sendButton}
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
  );
};

export default ChatPanel;
